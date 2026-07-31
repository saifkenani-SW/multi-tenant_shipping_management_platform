import { Injectable, Logger } from '@nestjs/common';
import {
  ActionType,
  CollectionMethod,
  ManifestItemStatus,
  ManifestStatus,
  ParcelCondition,
  ParcelStatus,
  TripStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';

@Injectable()
export class TripManifestSeeder implements Seeder {
  private readonly logger = new Logger(TripManifestSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting TripManifestSeeder...');

    const tenant1 = SEEDED_TENANTS[0];
    const driver = await this.prisma.employee.findFirst({
      where: { tenant_id: tenant1.id },
    });
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { tenant_id: tenant1.id },
    });
    const orgUnit = await this.prisma.organization_unit.findFirst({
      where: { tenant_id: tenant1.id },
    });
    const parcel1 = await this.prisma.parcel.findFirst({
      where: { tenant_id: tenant1.id },
    });

    if (!driver || !orgUnit || !parcel1) {
      this.logger.warn(
        'Skipping TripManifestSeeder: missing driver/orgUnit/parcel',
      );
      return;
    }

    const tripId = '00000000-0000-7000-8000-000000001201';
    const trip = await this.prisma.trip.upsert({
      where: { id: tripId },
      update: {
        status: TripStatus.IN_PROGRESS,
      },
      create: {
        id: tripId,
        tenant_id: tenant1.id,
        driver_id: driver.id,
        vehicle_id: vehicle ? vehicle.id : null,
        origin_org_unit_id: orgUnit.id,
        destination_org_unit_id: orgUnit.id,
        status: TripStatus.IN_PROGRESS,
        scheduled_at: new Date(),
        started_at: new Date(),
      },
    });

    const manifestId = '00000000-0000-7000-8000-000000001211';
    const manifest = await this.prisma.transport_manifest.upsert({
      where: { id: manifestId },
      update: {
        status: ManifestStatus.IN_TRANSIT,
      },
      create: {
        id: manifestId,
        tenant_id: tenant1.id,
        trip_id: trip.id,
        origin_org_unit_id: orgUnit.id,
        destination_org_unit_id: orgUnit.id,
        status: ManifestStatus.IN_TRANSIT,
      },
    });

    const itemId = '00000000-0000-7000-8000-000000001221';
    await this.prisma.manifest_item.upsert({
      where: {
        manifest_id_parcel_id: {
          manifest_id: manifest.id,
          parcel_id: parcel1.id,
        },
      },
      update: {
        status: ManifestItemStatus.LOADED,
      },
      create: {
        id: itemId,
        manifest_id: manifest.id,
        parcel_id: parcel1.id,
        status: ManifestItemStatus.LOADED,
        loaded_at: new Date(),
      },
    });

    const movementId = '00000000-0000-7000-8000-000000001231';
    await this.prisma.parcel_movement.upsert({
      where: { id: movementId },
      update: {
        action_type: ActionType.LOADED_ON_TRIP,
      },
      create: {
        id: movementId,
        tenant_id: tenant1.id,
        parcel_id: parcel1.id,
        organization_unit_id: orgUnit.id,
        trip_id: trip.id,
        action_type: ActionType.LOADED_ON_TRIP,
        parcel_status_snapshot: ParcelStatus.IN_TRANSIT,
        parcel_condition_snapshot: ParcelCondition.NORMAL,
        performed_by_employee_id: driver.id,
        notes: 'Parcel loaded on trip',
      },
    });

    const podId = '00000000-0000-7000-8000-000000001241';
    await this.prisma.proof_of_delivery.upsert({
      where: { parcel_id: parcel1.id },
      update: {
        received_by_name: 'Jane Receiver',
        otp_verified: true,
      },
      create: {
        id: podId,
        tenant_id: tenant1.id,
        parcel_id: parcel1.id,
        delivered_by_employee_id: driver.id,
        collection_method: CollectionMethod.CUSTOMER,
        received_by_name: 'Jane Receiver',
        otp_verified: true,
        otp_verified_at: new Date(),
        signature_url: 'https://cdn.fastship.com/pod/sig.png',
        delivery_lat: 24.6901,
        delivery_lng: 46.6853,
      },
    });

    this.logger.log('TripManifestSeeder completed.');
  }
}
