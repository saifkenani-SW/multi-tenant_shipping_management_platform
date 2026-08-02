import { Injectable, Logger } from '@nestjs/common';
import { CustomerShipmentCommandRepository } from '../../infrastructure/repositories/customer-shipment.command.repository';
import { CreateCustomerShipmentDto } from '../dtos/requests/create-customer-shipment.dto';
import { UpdateCustomerShipmentDto } from '../dtos/requests/update-customer-shipment.dto';
import { CustomerShipmentEntity } from '../../domain/entities/customer-shipment.entity';
import { Parcel } from '../../domain/entities/parcel.entity';
import { ShipmentStatus } from '../../domain/enums/shipment-status.enum';
import { v7 as uuidv7 } from 'uuid';
import { TenantFacade } from '../../../tenant/application/facades/tenant.facade';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CustomerShipmentCreatedEvent } from '../../domain/events/customer-shipment-created.event';
import { CacheEvict } from '../../../../infrastructure/cache/decorators/CacheEvict';
import { SHIPMENT_CACHE_KEYS } from '../../constants/shipment.cache.constants';

@Injectable()
export class CustomerShipmentCommandService {
  private readonly logger = new Logger(CustomerShipmentCommandService.name);

  constructor(
    private readonly commandRepository: CustomerShipmentCommandRepository,
    private readonly tenantFacade: TenantFacade,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @CacheEvict({
    keyPrefix: SHIPMENT_CACHE_KEYS.LIST,
    allEntries: true,
  })
  async createShipment(
    tenantId: string,
    dto: CreateCustomerShipmentDto,
  ): Promise<string> {
    this.logger.log(`Creating shipment for tenant ${tenantId}`);

    const tenantSettings = await this.tenantFacade.getTenantSettings(tenantId);
    const trackingPrefix = tenantSettings.operational?.trackingPrefix || 'SHP';
    const volumetricDivisor = tenantSettings.pricing?.volumetricDivisor || 5000;

    const shipmentId = uuidv7();

    const parcels = dto.parcels.map((parcelDto) => {
      const parcelTrackingNumber = `${trackingPrefix}-${Math.floor(10000000 + Math.random() * 90000000)}`;
      return Parcel.create(
        uuidv7(),
        tenantId,
        shipmentId,
        parcelTrackingNumber,
        parcelDto.actualWeightKg,
        parcelDto.lengthCm,
        parcelDto.widthCm,
        parcelDto.heightCm,
        parcelDto.condition,
        volumetricDivisor,
      );
    });

    const shipment = new CustomerShipmentEntity({
      id: shipmentId,
      tenantId,
      senderCustomerProfileId: dto.senderCustomerProfileId,
      receiverCustomerProfileId: dto.receiverCustomerProfileId,
      shipmentRequestId: dto.shipmentRequestId,
      approvedQuotationId: undefined, // dto doesn't have it yet or it's handled differently
      receiverName: dto.receiverName,
      receiverPhone: dto.receiverPhone,
      receiverAddress: dto.receiverAddress,
      paymentResponsibility: dto.paymentResponsibility,
      status: ShipmentStatus.PENDING,
      parcels,
    });

    shipment.calculateTotalChargeableWeight();

    const savedShipment = await this.commandRepository.create(shipment);

    this.eventEmitter.emit(
      CustomerShipmentCreatedEvent.EVENT_NAME,
      new CustomerShipmentCreatedEvent(
        savedShipment.id,
        savedShipment.tenantId,
        savedShipment.shipmentRequestId,
      ),
    );

    return savedShipment.id;
  }

  @CacheEvict({
    keyPrefix: SHIPMENT_CACHE_KEYS.LIST,
    allEntries: true,
  })
  @CacheEvict({
    keyPrefix: SHIPMENT_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [SHIPMENT_CACHE_KEYS.DETAILS, id],
  })
  async updateShipment(
    id: string,
    dto: UpdateCustomerShipmentDto,
  ): Promise<void> {
    this.logger.log(`Updating shipment ${id}`);

    await this.commandRepository.update(id, {
      receiverName: dto.receiverName,
      receiverPhone: dto.receiverPhone,
      receiverAddress: dto.receiverAddress,
      paymentResponsibility: dto.paymentResponsibility,
    });
  }
}
