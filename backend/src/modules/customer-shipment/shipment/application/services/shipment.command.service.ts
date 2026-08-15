import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomBytes } from 'crypto';
import {
  ParcelType,
  PaymentResponsibility,
  ServiceLevel,
  ShipmentStatus,
} from '@prisma/client';
import { RequestContextService } from '../../../../../packages/context/services/request-context.service';
import { Transactional } from '../../../../../packages/transaction';
import { Authorize } from '../../../../../packages/authorization';
import { Policy } from '../../../../../packages/authorization/policy';
import { ShipmentPolicy } from '../../domain/authorization/policies/shipment.policy';
import { ShipmentAction } from '../../domain/authorization/actions/shipment.action';
import { TenantFacade } from '../../../../tenant/application/facades/tenant.facade';
import { CustomerFacade } from '../../../../customer/facades/customer.facade';
import { EmployeeFacade } from '../../../../employee/facades/employee.facade';
import { ShipmentRequestFacade } from '../../../../shipment-request/facades/shipment-request.facade';
import { BillingFacade } from '../../../../billing/facades/billing.facade';
import { OrganizationFacade } from '../../../../organization/facades/organization.facade';
import { LabelGeneratorService } from '../../../../../packages/label-generator/services/label-generator.service';
import { PdfGeneratorService } from '../../../../../packages/pdf-generator/services/pdf-generator.service';
import type {
  IStorageProvider,
  StorageFile,
} from '../../../../../packages/storage/src';
import { STORAGE_PROVIDER } from '../../../../../packages/storage/src';
import { ShipmentCommandRepository } from '../../infrastructure/repositories/shipment.command.repository';
import { ParcelCommandRepository } from '../../../parcel/infrastructure/repositories/parcel.command.repository';
import { ParcelQueryRepository } from '../../../parcel/infrastructure/repositories/parcel.query.repository';
import { ShipmentQueryService } from './shipment.query.service';
import {
  CreateShipmentDto,
  CreateShipmentParcelDto,
} from '../dtos/requests/create-shipment.dto';
import {
  CUSTOMER_SHIPMENT_EVENTS,
  CustomerShipmentCreatedPayload,
  CustomerShipmentLifecyclePayload,
} from '../../../constants/customer-shipment.events';
import { CUSTOMER_SHIPMENT_CACHE_KEYS, PARCEL_LABEL_STORAGE_CATEGORY } from '../../../constants/customer-shipment.cache.constants';
import { CacheEvict } from '../../../../../infrastructure/cache/decorators/CacheEvict';

/** A parcel with everything computed before the transaction opens. */
interface PreparedParcel {
  dto: CreateShipmentParcelDto;
  trackingNumber: string;
  volumetricWeightKg: number;
  labelKey: string | null;
}

const DEFAULT_VOLUMETRIC_DIVISOR = 5000;
const DEFAULT_TRACKING_PREFIX = 'SHP';
const TRACKING_NUMBER_ATTEMPTS = 5;

@Injectable()
export class ShipmentCommandService {
  private readonly logger = new Logger(ShipmentCommandService.name);

  constructor(
    private readonly commandRepository: ShipmentCommandRepository,
    private readonly parcelCommandRepository: ParcelCommandRepository,
    private readonly parcelQueryRepository: ParcelQueryRepository,
    private readonly queryService: ShipmentQueryService,
    private readonly tenantFacade: TenantFacade,
    private readonly customerFacade: CustomerFacade,
    private readonly employeeFacade: EmployeeFacade,
    private readonly shipmentRequestFacade: ShipmentRequestFacade,
    private readonly billingFacade: BillingFacade,
    private readonly organizationFacade: OrganizationFacade,
    private readonly labelGenerator: LabelGeneratorService,
    private readonly pdfGenerator: PdfGeneratorService,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
    private readonly eventEmitter: EventEmitter2,
    private readonly requestContext: RequestContextService,
  ) {}

  /**
   * Creates a shipment together with all of its parcels.
   *
   * Validation and the expensive work (label rendering, PDF, upload) happen
   * before the transaction opens, so the database transaction stays short and
   * never waits on a browser render or a storage round trip. Only the writes
   * are transactional.
   */
  @Authorize({
    policy: Policy(ShipmentPolicy, ShipmentAction.Create),
    payloadResolver: (dto: CreateShipmentDto) => ({
      originOrgUnitId: dto.originOrgUnitId,
    }),
  })
  @CacheEvict({
    keyPrefix: CUSTOMER_SHIPMENT_CACHE_KEYS.LIST,
    allEntries: true,
  })
  async createShipment(dto: CreateShipmentDto): Promise<{ id: string }> {
    const principal = this.requestContext.getPrincipal();
    const tenantId = principal.tenantId;

    if (!tenantId) {
      throw new BadRequestException('Tenant ID is missing from context.');
    }
    const employeeId = principal.profileId;

    if (dto.originOrgUnitId === dto.destinationOrgUnitId) {
      throw new BadRequestException(
        'Origin and destination cannot be the same organization unit.',
      );
    }

    const orgUnitIds = new Set<string>();
    if (dto.originOrgUnitId) orgUnitIds.add(dto.originOrgUnitId);
    if (dto.destinationOrgUnitId) orgUnitIds.add(dto.destinationOrgUnitId);

    if (orgUnitIds.size > 0) {
      const areValid =
        await this.organizationFacade.validateOrganizationUnitsExist(
          tenantId,
          Array.from(orgUnitIds),
        );
      if (!areValid) {
        throw new BadRequestException(
          'One or more organization units do not exist or do not belong to this tenant.',
        );
      }
    }

    const settings = await this.tenantFacade.getTenantSettings(tenantId);

    if (
      settings?.operational?.requireSenderNationalId &&
      !dto.senderNationalId
    ) {
      throw new BadRequestException(
        'This tenant requires the sender national id.',
      );
    }

    const pricing = await this.tenantFacade.getTenantPricingSettings(tenantId);
    const volumetricDivisor =
      Number(pricing?.volumetricDivisor) || DEFAULT_VOLUMETRIC_DIVISOR;
    const trackingPrefix =
      settings?.operational?.trackingPrefix || DEFAULT_TRACKING_PREFIX;

    const prepared = await this.prepareParcels(
      dto,
      trackingPrefix,
      volumetricDivisor,
    );

    const totalChargeableWeightKg = prepared.reduce(
      (total, parcel) =>
        total + Math.max(parcel.dto.actualWeightKg, parcel.volumetricWeightKg),
      0,
    );

    const employeeName = employeeId
      ? await this.employeeFacade.getEmployeeName(employeeId)
      : null;

    return this.persistShipment(
      tenantId,
      dto,
      prepared,
      totalChargeableWeightKg,
      employeeId,
      employeeName,
    );
  }

  /**
   * The atomic part: the shipment row, every parcel, the shipment-request
   * conversion and the created event all commit together or not at all.
   */
  @Transactional()
  private async persistShipment(
    tenantId: string,
    dto: CreateShipmentDto,
    prepared: PreparedParcel[],
    totalChargeableWeightKg: number,
    employeeId?: string | null,
    employeeName?: string | null,
  ): Promise<{ id: string }> {
    const shipment = await this.commandRepository.create({
      tenantId,
      senderName: dto.senderName,
      senderPhone: dto.senderPhone,
      senderNationalId: dto.senderNationalId ?? null,
      shipmentRequestId: dto.shipmentRequestId ?? null,
      originOrgUnitId: dto.originOrgUnitId,
      destinationOrgUnitId: dto.destinationOrgUnitId,
      serviceLevel: dto.serviceLevel ?? ServiceLevel.STANDARD,
      receiverName: dto.receiverName,
      receiverPhone: dto.receiverPhone,
      paymentResponsibility:
        dto.paymentResponsibility ?? PaymentResponsibility.SENDER,
      totalChargeableWeightKg,
      status: ShipmentStatus.PROCESSING,
      createdByEmployeeId: employeeId,
      createdByEmployeeName: employeeName,
    });

    for (const parcel of prepared) {
      await this.parcelCommandRepository.create({
        tenantId,
        customerShipmentId: shipment.id,
        trackingNumber: parcel.trackingNumber,
        description: parcel.dto.description ?? null,
        category: parcel.dto.category ?? null,
        parcelType: parcel.dto.parcelType ?? ParcelType.PACKAGE,
        isFragile: parcel.dto.isFragile ?? false,
        requiresUprightHandling: parcel.dto.requiresUprightHandling ?? false,
        temperatureSensitive: parcel.dto.temperatureSensitive ?? false,
        actualWeightKg: parcel.dto.actualWeightKg,
        lengthCm: parcel.dto.lengthCm,
        widthCm: parcel.dto.widthCm,
        heightCm: parcel.dto.heightCm,
        volumetricWeightKg: parcel.volumetricWeightKg,
        destinationOrgUnitId: dto.destinationOrgUnitId,
        currentOrgUnitId: dto.originOrgUnitId,
        labelKey: parcel.labelKey,
      });
    }

    // The invoice belongs to this act, not to a later one: a shipment that
    // exists without its invoice is not a state worth allowing, so this shares
    // the transaction and fails it if billing fails.
    await this.billingFacade.createInvoiceForShipment({
      tenantId,
      customerShipmentId: shipment.id,
      senderName: dto.senderName,
      senderPhone: dto.senderPhone,
      receiverName: dto.receiverName,
      receiverPhone: dto.receiverPhone,
      originOrgUnitId: dto.originOrgUnitId,
      destinationOrgUnitId: dto.destinationOrgUnitId,
      paymentResponsibility:
        dto.paymentResponsibility ?? PaymentResponsibility.SENDER,
      subtotal: dto.billing.subtotal,
      handlingFees: dto.billing.handlingFees,
      taxAmount: dto.billing.taxAmount,
      discountAmount: dto.billing.discountAmount,
    });

    if (dto.shipmentRequestId) {
      await this.shipmentRequestFacade.convertToShipment(dto.shipmentRequestId);
    }

    const payload: CustomerShipmentCreatedPayload = {
      shipmentId: shipment.id,
      tenantId,
      totalAmount: null,
      paymentResponsibility:
        dto.paymentResponsibility ?? PaymentResponsibility.SENDER,
      currency: null,
    };

    await this.eventEmitter.emitAsync(
      CUSTOMER_SHIPMENT_EVENTS.CREATED,
      payload,
    );

    return { id: shipment.id };
  }


  /** PENDING or PROCESSING -> CANCELLED. The aggregate refuses it after dispatch. */
  @Authorize({
    policy: Policy(ShipmentPolicy, ShipmentAction.Cancel),
    payloadResolver: (shipmentId: string) => ({ shipmentId }),
  })
  @CacheEvict([
    {
      keyPrefix: CUSTOMER_SHIPMENT_CACHE_KEYS.LIST,
      allEntries: true,
    },
    {
      keyPrefix: CUSTOMER_SHIPMENT_CACHE_KEYS.DETAILS,
      keyBuilder: (shipmentId: string) => [
        CUSTOMER_SHIPMENT_CACHE_KEYS.DETAILS,
        shipmentId,
      ],
    },
  ])
  @Transactional()
  async cancelShipment(shipmentId: string): Promise<void> {
    const shipment = await this.queryService.findAggregateOrThrow(shipmentId);

    shipment.cancel();

    await this.commandRepository.updateStatus(
      shipmentId,
      shipment.status,
      shipment.version,
    );

    // Cancelling the shipment voids what was billed for it. Refuses when the
    // money has already been taken — that needs a refund, not a status flip.
    await this.billingFacade.cancelInvoiceForShipment(shipmentId);

    const payload: CustomerShipmentLifecyclePayload = {
      shipmentId,
      tenantId: shipment.tenantId,
    };

    await this.eventEmitter.emitAsync(
      CUSTOMER_SHIPMENT_EVENTS.CANCELLED,
      payload,
    );
  }

  private async prepareParcels(
    dto: CreateShipmentDto,
    trackingPrefix: string,
    volumetricDivisor: number,
  ): Promise<PreparedParcel[]> {
    const prepared: PreparedParcel[] = [];

    for (const parcelDto of dto.parcels) {
      const trackingNumber =
        await this.generateUniqueTrackingNumber(trackingPrefix);

      const volumetricWeightKg = this.calculateVolumetricWeight(
        parcelDto,
        volumetricDivisor,
      );

      const labelKey = await this.generateLabel(
        trackingNumber,
        dto,
        parcelDto,
        volumetricWeightKg,
      );

      prepared.push({
        dto: parcelDto,
        trackingNumber,
        volumetricWeightKg,
        labelKey,
      });
    }

    return prepared;
  }

  private calculateVolumetricWeight(
    parcel: CreateShipmentParcelDto,
    volumetricDivisor: number,
  ): number {
    const raw =
      (parcel.lengthCm * parcel.widthCm * parcel.heightCm) / volumetricDivisor;

    return Math.round(raw * 100) / 100;
  }

  /**
   * Tracking numbers are globally unique. The random suffix makes a clash
   * unlikely; the retry makes it harmless. A caller is told plainly rather than
   * meeting a raw unique-constraint error at insert time.
   */
  private async generateUniqueTrackingNumber(prefix: string): Promise<string> {
    for (let attempt = 0; attempt < TRACKING_NUMBER_ATTEMPTS; attempt++) {
      const suffix = randomBytes(3).toString('hex').toUpperCase();
      const candidate = `${prefix}-${Date.now()}-${suffix}`;

      if (
        !(await this.parcelQueryRepository.existsByTrackingNumber(candidate))
      ) {
        return candidate;
      }
    }

    throw new BadRequestException(
      'Could not allocate a unique tracking number. Please retry.',
    );
  }

  /**
   * Renders the label and stores it, returning the storage KEY — never a URL.
   * The URL is derived on demand by the storage provider.
   *
   * A label is a convenience, not a precondition for shipping: if rendering or
   * upload fails the shipment is still created and the parcel simply carries no
   * label key, which can be regenerated later.
   */
  private async generateLabel(
    trackingNumber: string,
    dto: CreateShipmentDto,
    parcel: CreateShipmentParcelDto,
    volumetricWeightKg: number,
  ): Promise<string | null> {
    try {
      const html = await this.labelGenerator.generate({
        qr: { value: trackingNumber, enabled: true },
        barcode: { value: trackingNumber, enabled: true },
        fields: [
          { label: 'Tracking', value: trackingNumber },
          { label: 'Receiver', value: dto.receiverName },
          { label: 'Phone', value: dto.receiverPhone },
          {
            label: 'Weight',
            value: `${Math.max(parcel.actualWeightKg, volumetricWeightKg)} kg`,
          },
          {
            label: 'Service',
            value: dto.serviceLevel ?? 'STANDARD',
          },
        ],
      });

      const pdf = await this.pdfGenerator.generate(html);

      const file: StorageFile = {
        originalname: `${trackingNumber}.pdf`,
        mimetype: 'application/pdf',
        size: pdf.length,
        buffer: pdf,
      };

      const saved = await this.storageProvider.save(
        file,
        trackingNumber,
        PARCEL_LABEL_STORAGE_CATEGORY,
      );

      return saved.storage_key;
    } catch (error) {
      this.logger.warn(
        `Label generation failed for ${trackingNumber}; the parcel is created without one. ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }
}
