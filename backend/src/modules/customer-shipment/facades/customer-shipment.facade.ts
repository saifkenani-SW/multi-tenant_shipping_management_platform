import { Injectable } from '@nestjs/common';
import { ShipmentQueryService } from '../shipment/application/services/shipment.query.service';
import { ParcelCommandService } from '../parcel/application/services/parcel.command.service';
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
    private readonly parcelCommandService: ParcelCommandService,
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

  /**
   * Parcels for a set of ids, scope-filtered, in one round trip.
   *
   * Lets another module label rows that only hold a parcel id — Fleet's
   * manifest items — without reading the parcel table itself.
   */
  async getParcelsByIds(parcelIds: string[]): Promise<ParcelResponseDto[]> {
    return this.parcelQueryService.getParcelsByIds(parcelIds);
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

  async getProofOfDeliveryByTrackingNumber(
    trackingNumber: string,
  ): Promise<ProofOfDeliveryResponseDto> {
    return this.podQueryService.findByTrackingNumber(trackingNumber);
  }

  /**
   * Called by the Fleet module when a driver picks up a parcel from a unit
   * and loads it onto their trip.
   */
  async pickUpParcel(parcelId: string, tripId: string): Promise<void> {
    await this.parcelCommandService.pickUpParcel(parcelId, tripId);
  }

  /**
   * Called by the Fleet module when a driver drops off a parcel at a unit,
   * concluding its transit on that trip.
   */
  async dropOffParcel(
    parcelId: string,
    orgUnitId: string,
    tripId?: string,
  ): Promise<void> {
    await this.parcelCommandService.dropOffParcel(parcelId, orgUnitId, tripId);
  }
}
