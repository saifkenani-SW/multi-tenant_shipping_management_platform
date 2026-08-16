import { Injectable, Logger } from '@nestjs/common';
import {
  ActionType,
  CollectionMethod,
  ManifestItemStatus,
  ManifestStatus,
  OrgType,
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
      where: { tenant_id: tenant1.id, employee_code: 'EMP-102' },
    });
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { tenant_id: tenant1.id, plate_number: '441203-دمشق' },
    });
    const origin = await this.prisma.organization_unit.findFirst({
      where: { tenant_id: tenant1.id, org_type: OrgType.HUB },
    });
    const destination = await this.prisma.organization_unit.findFirst({
      where: {
        tenant_id: tenant1.id,
        name: 'فرع حلب — العزيزية',
      },
    });
    const parcel1 = await this.prisma.parcel.findUnique({
      where: { id: '00000000-0000-7000-8000-000000001101' },
    });
    const deliveredParcel = await this.prisma.parcel.findUnique({
      where: { id: '00000000-0000-7000-8000-000000001107' },
    });

    if (!driver || !origin || !destination || !parcel1) {
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
        origin_org_unit_id: origin.id,
        destination_org_unit_id: destination.id,
      },
      create: {
        id: tripId,
        tenant_id: tenant1.id,
        driver_id: driver.id,
        vehicle_id: vehicle ? vehicle.id : null,
        origin_org_unit_id: origin.id,
        destination_org_unit_id: destination.id,
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
        origin_org_unit_id: origin.id,
        destination_org_unit_id: destination.id,
        status: ManifestStatus.IN_TRANSIT,
      },
    });

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
        performed_by_name: driver.full_name,
        notes: 'تم تحميل الطرد على رحلة دمشق — حلب',
        organization_unit_name: origin.name,
        organization_type: origin.org_type,
      },
      create: {
        tenant_id: tenant1.id,
        parcel_id: parcel1.id,
        organization_unit_id: origin.id,
        trip_id: trip.id,
        action_type: ActionType.LOADED_ON_TRIP,
        new_status: ParcelStatus.IN_TRANSIT,
        new_condition: ParcelCondition.NORMAL,
        performed_by_employee_id: driver.id,
        performed_by_name: driver.full_name,
        organization_unit_name: origin.name,
        organization_type: origin.org_type,
        notes: 'تم تحميل الطرد على رحلة دمشق — حلب',
      },
    });

    if (deliveredParcel) {
      await this.prisma.proof_of_delivery.upsert({
        where: { parcel_id: deliveredParcel.id },
        update: {
          received_by_name: 'هبة محمد عطري',
          otp_verified: true,
        },
        create: {
          tenant_id: tenant1.id,
          parcel_id: deliveredParcel.id,
          delivered_by_employee_id: driver.id,
          delivered_by_employee_name: driver.full_name,
          collection_method: CollectionMethod.CUSTOMER,
          received_by_name: 'هبة محمد عطري',
          otp_verified: true,
          otp_verified_at: new Date(),
          signature_key: null,
          delivery_lat: 35.5208,
          delivery_lng: 35.7812,
        },
      });
    }

    this.logger.log('TripManifestSeeder completed.');
  }
}
