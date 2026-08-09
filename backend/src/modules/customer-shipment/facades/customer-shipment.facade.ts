import { Injectable } from '@nestjs/common';
import { ShipmentQueryService } from '../shipment/application/services/shipment.query.service';
import { ParcelQueryService } from '../parcel/application/services/parcel.query.service';
import { ProofOfDeliveryQueryService } from '../proof-of-delivery/application/services/proof-of-delivery.query.service';
import { ShipmentResponseDto } from '../shipment/application/dtos/responses/shipment.response.dto';
import { ParcelResponseDto } from '../parcel/application/dtos/responses/parcel.response.dto';
import { ProofOfDeliveryResponseDto } from '../proof-of-delivery/application/dtos/responses/proof-of-delivery.response.dto';
import { ParcelMapper } from '../parcel/application/mappers/parcel.mapper';

/**
 * The only entry point into the Customer Shipment module.
 *
 * Shipments, parcels and proofs of delivery are internal: other modules must
 * not reach their services, repositories or tables directly, only the methods
 * exposed here.
 */
@Injectable()
export class CustomerShipmentFacade {
  constructor(
    private readonly shipmentQueryService: ShipmentQueryService,
    private readonly parcelQueryService: ParcelQueryService,
    private readonly podQueryService: ProofOfDeliveryQueryService,
    private readonly parcelMapper: ParcelMapper,
  ) {}

  async getShipment(shipmentId: string): Promise<ShipmentResponseDto> {
    return this.shipmentQueryService.findById(shipmentId);
  }

  async getParcel(parcelId: string): Promise<ParcelResponseDto> {
    return this.parcelQueryService.findById(parcelId);
  }

  async getParcelByTrackingNumber(
    trackingNumber: string,
  ): Promise<ParcelResponseDto> {
    return this.parcelQueryService.findByTrackingNumber(trackingNumber);
  }

  /** Every parcel of a shipment, so callers do not query the table themselves. */
  async getParcelsOfShipment(shipmentId: string): Promise<ParcelResponseDto[]> {
    const raw =
      await this.parcelQueryService.getRawParcelsForShipment(shipmentId);

    return raw.map((row) => this.parcelMapper.toResponse(row));
  }

  async getProofOfDelivery(
    parcelId: string,
  ): Promise<ProofOfDeliveryResponseDto> {
    return this.podQueryService.findByParcelId(parcelId);
  }
}
