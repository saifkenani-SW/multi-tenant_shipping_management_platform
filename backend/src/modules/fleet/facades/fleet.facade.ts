import { Injectable } from '@nestjs/common';
import { VehicleQueryService } from '../vehicle/application/services/vehicle-query.service';
import { TripQueryService } from '../trip/application/services/trip-query.service';
import { ManifestQueryService } from '../transport_manifest/application/services/manifest-query.service';
import { VehicleDetailsDto } from '../vehicle/application/dtos/responses/vehicle-details.dto';
import { TripDetailsDto } from '../trip/application/dtos/responses/trip-details.dto';
import { ManifestDetailsDto } from '../transport_manifest/application/dtos/responses/manifest-details.dto';

/**
 * The only entry point into the Fleet module.
 *
 * Vehicles, vehicle assignments, trips, manifests and manifest items are
 * internal to this module: other modules must not reach their services,
 * repositories or tables directly, only the methods exposed here.
 */
@Injectable()
export class FleetFacade {
  constructor(
    private readonly vehicleQueryService: VehicleQueryService,
    private readonly tripQueryService: TripQueryService,
    private readonly manifestQueryService: ManifestQueryService,
  ) {}

  /**
   * Whether a vehicle exists in this tenant and is ACTIVE.
   * Returns false instead of throwing so callers can treat it as a check.
   */
  async isVehicleOperable(
    tenantId: string,
    vehicleId: string,
  ): Promise<boolean> {
    try {
      const vehicle = await this.vehicleQueryService.findVehicleOrThrow(
        tenantId,
        vehicleId,
      );
      return vehicle.isOperable();
    } catch {
      return false;
    }
  }

  async getVehicleDetails(
    tenantId: string,
    vehicleId: string,
  ): Promise<VehicleDetailsDto> {
    return this.vehicleQueryService.getVehicleDetails(tenantId, vehicleId);
  }

  /**
   * The vehicle a driver is currently assigned to, or null when unassigned.
   * Used when building a driver's session context.
   */
  async getActiveVehicleIdForDriver(
    tenantId: string,
    employeeId: string,
  ): Promise<string | null> {
    return this.vehicleQueryService.getActiveVehicleIdForDriver(
      tenantId,
      employeeId,
    );
  }

  async getTripDetails(
    tenantId: string,
    tripId: string,
  ): Promise<TripDetailsDto> {
    return this.tripQueryService.getTripDetails(tenantId, tripId);
  }

  async getManifestDetails(
    tenantId: string,
    manifestId: string,
  ): Promise<ManifestDetailsDto> {
    return this.manifestQueryService.getManifestDetails(tenantId, manifestId);
  }

  /**
   * Whether a parcel is currently committed to a manifest that has not
   * finished yet. Lets other modules answer "is this parcel in transit?"
   * without reading Fleet tables.
   */
  async isParcelInActiveManifest(
    tenantId: string,
    parcelId: string,
  ): Promise<boolean> {
    return this.manifestQueryService.isParcelInActiveManifest(
      tenantId,
      parcelId,
    );
  }
}
