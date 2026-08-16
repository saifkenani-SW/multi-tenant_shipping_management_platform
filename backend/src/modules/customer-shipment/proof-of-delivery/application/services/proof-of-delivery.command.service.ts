import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import {
  ActionType,
  CollectionMethod,
  ParcelStatus,
  PaymentMethod,
} from '@prisma/client';
import { Transactional } from '../../../../../packages/transaction';
import { Authorize } from '../../../../../packages/authorization';
import { Policy } from '../../../../../packages/authorization/policy';
import { ParcelPolicy } from '../../../parcel/domain/authorization/policies/parcel.policy';
import { ParcelAction } from '../../../parcel/domain/authorization/actions/parcel.action';
import { TrackingFacade } from '../../../../tracking/application/facades/tracking.facade';
import { AppendParcelMovementCommand } from '../../../../tracking/application/commands/append-parcel-movement.command';
import { ProofOfDeliveryCommandRepository } from '../../infrastructure/repositories/proof-of-delivery.command.repository';
import { ProofOfDeliveryQueryRepository } from '../../infrastructure/repositories/proof-of-delivery.query.repository';
import { ParcelQueryRepository } from '../../../parcel/infrastructure/repositories/parcel.query.repository';
import { ParcelCommandRepository } from '../../../parcel/infrastructure/repositories/parcel.command.repository';
import { ShipmentStatusRecalculator } from '../../../shipment/application/services/shipment-status.recalculator';
import { BillingFacade } from '../../../../billing/facades/billing.facade';
import { EmployeeFacade } from '../../../../employee/facades/employee.facade';
import { TenantFacade } from '../../../../tenant/application/facades/tenant.facade';
import { RecordDeliveryDto } from '../dtos/requests/record-delivery.dto';
import type { IStorageProvider } from '../../../../../packages/storage/src';
import { STORAGE_PROVIDER } from '../../../../../packages/storage/src';
import { CUSTOMER_SHIPMENT_CACHE_KEYS } from '../../../constants/customer-shipment.cache.constants';
import { CacheEvict } from '../../../../../infrastructure/cache/decorators/CacheEvict';
import { Inject } from '@nestjs/common';
import type { ICacheFacade } from '../../../../../core/cache/interfaces/ICacheFacade';
import { CACHE_FACADE } from '../../../../../core/cache/tokens/cache.tokens';

@Injectable()
export class ProofOfDeliveryCommandService {
  constructor(
    private readonly commandRepository: ProofOfDeliveryCommandRepository,
    private readonly queryRepository: ProofOfDeliveryQueryRepository,
    private readonly parcelQueryRepository: ParcelQueryRepository,
    private readonly parcelCommandRepository: ParcelCommandRepository,
    private readonly trackingFacade: TrackingFacade,
    private readonly shipmentRecalculator: ShipmentStatusRecalculator,
    private readonly billingFacade: BillingFacade,
    private readonly employeeFacade: EmployeeFacade,
    private readonly tenantFacade: TenantFacade,
    @Inject(CACHE_FACADE)
    private readonly cache: ICacheFacade,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {}

  /**
   * Records the delivery of one parcel.
   *
   * The shipment invoice must be fully paid first. A payment attached to this
   * request is recorded in the same transaction so a receiver-paid handover can
   * settle and deliver in one act. Then the proof row, the parcel moving to
   * COLLECTED, tracking, and the shipment status all commit together.
   */
  @CacheEvict({
    keyPrefix: CUSTOMER_SHIPMENT_CACHE_KEYS.PREFIX,
    allEntries: true,
  })
  @Transactional()
  async recordDelivery(
    trackingNumber: string,
    dto: RecordDeliveryDto,
    files: {
      signature?: any[];
      idPhoto?: any[];
      parcelPhoto?: any[];
      additionalPhoto?: any[];
    },
    employeeId: string,
  ): Promise<{ id: string }> {
    // Resolve the tracking number to the aggregate carrying its optimistic-lock
    // version. The UUID is only used internally from this point onward.
    const parcel =
      await this.parcelQueryRepository.findAggregateByTrackingNumber(
        trackingNumber,
      );

    if (!parcel) {
      throw new ConflictException('Parcel not found.');
    }

    if (await this.queryRepository.existsForParcel(parcel.id)) {
      throw new ConflictException(
        'This parcel already has a proof of delivery.',
      );
    }

    // A parcel cannot be proven delivered before it is collectable.
    parcel.assertCollectable();

    const previousStatus = parcel.currentStatus;
    const alreadyCollected = parcel.isCollected();

    // Billing is the gate: no proof, no files, no status change until the
    // invoice is fully paid. Optional payment on this request settles COD
    // in the same transaction; a short payment rolls the whole handover back.
    if (dto.payment) {
      await this.billingFacade.recordPaymentForShipment(
        parcel.customerShipmentId,
        {
          amount: dto.payment.amount,
          paymentMethod: dto.payment.paymentMethod ?? PaymentMethod.CASH,
          collectedByEmployeeId: employeeId,
          organizationUnitId: parcel.currentOrgUnitId,
          transactionReference: dto.payment.transactionReference ?? null,
        },
      );
    }

    await this.billingFacade.assertSettledForDelivery(
      parcel.customerShipmentId,
    );

    const tenantSettings = await this.tenantFacade.getTenantSettings(
      parcel.tenantId,
    );
    const deliverySettings = tenantSettings?.delivery;

    if (deliverySettings?.requireSignature && !files.signature?.length) {
      throw new BadRequestException(
        'Signature is required by tenant settings.',
      );
    }
    if (deliverySettings?.requireIdPhoto && !files.idPhoto?.length) {
      throw new BadRequestException('ID Photo is required by tenant settings.');
    }
    if (deliverySettings?.requireProofPhoto && !files.parcelPhoto?.length) {
      throw new BadRequestException(
        'Parcel Photo is required by tenant settings.',
      );
    }

    let signatureKey: string | null = null;
    let idPhotoKey: string | null = null;
    let parcelPhotoKey: string | null = null;
    let additionalPhotoKey: string | null = null;

    if (files.signature?.length) {
      const result = await this.storageProvider.save(
        files.signature[0] as any,
        parcel.tenantId,
        'pod',
      );
      signatureKey = result.storage_key;
    }

    if (files.idPhoto?.length) {
      const result = await this.storageProvider.save(
        files.idPhoto[0] as any,
        parcel.tenantId,
        'pod',
      );
      idPhotoKey = result.storage_key;
    }

    if (files.parcelPhoto?.length) {
      const result = await this.storageProvider.save(
        files.parcelPhoto[0] as any,
        parcel.tenantId,
        'pod',
      );
      parcelPhotoKey = result.storage_key;
    }

    if (files.additionalPhoto?.length) {
      // Store the first additional photo or join keys if multiple are allowed and backend structure supports it.
      // DTO only holds one string, but the array can be up to 3.
      // Assuming we just store the first one for now, or join them by comma.
      const keys: string[] = [];
      for (const photo of files.additionalPhoto) {
        const result = await this.storageProvider.save(
          photo as any,
          parcel.tenantId,
          'pod',
        );
        keys.push(result.storage_key);
      }
      additionalPhotoKey = keys.join(',');
    }

    const employeeName =
      (await this.employeeFacade.getEmployeeName(employeeId)) ?? 'Unknown';

    const created = await this.commandRepository.create({
      tenantId: parcel.tenantId,
      parcelId: parcel.id,
      deliveredByEmployeeId: employeeId,
      deliveredByEmployeeName: employeeName,
      collectionMethod: dto.collectionMethod ?? CollectionMethod.CUSTOMER,
      receivedByName: dto.receivedByName,
      receivedByNationalId: dto.receivedByNationalId ?? null,
      otpVerified: dto.otpVerified ?? false,
      otpVerifiedAt: dto.otpVerified ? new Date() : null,
      signatureKey,
      idPhotoKey,
      parcelPhotoKey,
      additionalPhotoKey,
      deliveryLat: dto.deliveryLat ?? null,
      deliveryLng: dto.deliveryLng ?? null,
    });

    // Recording proof for an already-collected parcel is legitimate catch-up
    // paperwork; only move the parcel when it has not moved yet.
    if (!alreadyCollected) {
      parcel.transitionTo(ParcelStatus.COLLECTED);

      await this.parcelCommandRepository.updateStatus(
        parcel.id,
        parcel.currentStatus,
        parcel.version,
      );

      const movement: AppendParcelMovementCommand = {
        tenantId: parcel.tenantId,
        parcelId: parcel.id,
        performedByEmployeeId: employeeId,
        actionType: ActionType.POD_COMPLETED,
        previousStatus,
        newStatus: parcel.currentStatus,
        previousCondition: parcel.currentCondition,
        newCondition: parcel.currentCondition,
        performedByName: employeeName,
        notes: `Received by ${dto.receivedByName}`,
      };

      await this.trackingFacade.appendMovement(movement);

      await this.shipmentRecalculator.recalculateFromParcels(
        parcel.customerShipmentId,
      );
    }

    return created;
  }
}
