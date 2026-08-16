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
import { ORG_UNIT_NAME } from '../rbac/organization-unit.seeder';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';

type ManifestSeed = {
  id: string;
  tenantIndex: number;
  originName: string;
  destName: string;
  status: ManifestStatus;
  tripId: string | null;
  parcelIds: string[];
  itemStatus: ManifestItemStatus;
};

type TripSeed = {
  id: string;
  tenantIndex: number;
  driverCode: string;
  originName: string;
  destName: string;
  status: TripStatus;
  hoursFromNow: number;
  durationHours?: number;
};

@Injectable()
export class TripManifestSeeder implements Seeder {
  private readonly logger = new Logger(TripManifestSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting TripManifestSeeder...');

    for (const trip of this.trips()) {
      await this.upsertTrip(trip);
    }

    for (const manifest of this.manifests()) {
      await this.upsertManifest(manifest);
    }

    await this.seedProofAndMovement();

    this.logger.log('TripManifestSeeder completed.');
  }

  private trips(): TripSeed[] {
    return [
      {
        id: '00000000-0000-7000-8000-000000001401',
        tenantIndex: 0,
        driverCode: 'EMP-114',
        originName: ORG_UNIT_NAME.MASARAT_HUB,
        destName: ORG_UNIT_NAME.MASARAT_ALEPPO,
        status: TripStatus.SCHEDULED,
        hoursFromNow: 8,
      },
      {
        id: '00000000-0000-7000-8000-000000001250',
        tenantIndex: 0,
        driverCode: 'EMP-112',
        originName: ORG_UNIT_NAME.MASARAT_HUB,
        destName: ORG_UNIT_NAME.MASARAT_LATAKIA,
        status: TripStatus.SCHEDULED,
        hoursFromNow: 6,
      },
      {
        id: '00000000-0000-7000-8000-000000001403',
        tenantIndex: 0,
        driverCode: 'EMP-113',
        originName: ORG_UNIT_NAME.MASARAT_HUB,
        destName: ORG_UNIT_NAME.MASARAT_DARAA,
        status: TripStatus.SCHEDULED,
        hoursFromNow: 3,
      },
      {
        id: '00000000-0000-7000-8000-000000001201',
        tenantIndex: 0,
        driverCode: 'EMP-102',
        originName: ORG_UNIT_NAME.MASARAT_HUB,
        destName: ORG_UNIT_NAME.MASARAT_ALEPPO,
        status: TripStatus.IN_PROGRESS,
        hoursFromNow: -4,
      },
      {
        id: '00000000-0000-7000-8000-000000001405',
        tenantIndex: 0,
        driverCode: 'EMP-111',
        originName: ORG_UNIT_NAME.MASARAT_HOMS,
        destName: ORG_UNIT_NAME.MASARAT_ALEPPO,
        status: TripStatus.IN_PROGRESS,
        hoursFromNow: -2,
      },
      {
        id: '00000000-0000-7000-8000-000000001406',
        tenantIndex: 1,
        driverCode: 'EMP-202',
        originName: ORG_UNIT_NAME.QADMOUS_HUB,
        destName: ORG_UNIT_NAME.QADMOUS_HOMS,
        status: TripStatus.IN_PROGRESS,
        hoursFromNow: -3,
      },
      {
        id: '00000000-0000-7000-8000-000000001407',
        tenantIndex: 2,
        driverCode: 'EMP-301',
        originName: ORG_UNIT_NAME.TROJAN_HUB,
        destName: ORG_UNIT_NAME.TROJAN_DAMASCUS,
        status: TripStatus.IN_PROGRESS,
        hoursFromNow: -5,
      },
      {
        id: '00000000-0000-7000-8000-000000001252',
        tenantIndex: 0,
        driverCode: 'EMP-111',
        originName: ORG_UNIT_NAME.MASARAT_HUB,
        destName: ORG_UNIT_NAME.MASARAT_HOMS,
        status: TripStatus.COMPLETED,
        hoursFromNow: -48,
        durationHours: 10,
      },
      {
        id: '00000000-0000-7000-8000-000000001410',
        tenantIndex: 0,
        driverCode: 'EMP-114',
        originName: ORG_UNIT_NAME.MASARAT_ALEPPO,
        destName: ORG_UNIT_NAME.MASARAT_HUB,
        status: TripStatus.COMPLETED,
        hoursFromNow: -36,
        durationHours: 12,
      },
      {
        id: '00000000-0000-7000-8000-000000001411',
        tenantIndex: 2,
        driverCode: 'EMP-301',
        originName: ORG_UNIT_NAME.TROJAN_RAQQA,
        destName: ORG_UNIT_NAME.TROJAN_DAMASCUS,
        status: TripStatus.COMPLETED,
        hoursFromNow: -60,
        durationHours: 18,
      },
      {
        id: '00000000-0000-7000-8000-000000001412',
        tenantIndex: 1,
        driverCode: 'EMP-202',
        originName: ORG_UNIT_NAME.QADMOUS_HOMS,
        destName: ORG_UNIT_NAME.QADMOUS_HUB,
        status: TripStatus.COMPLETED,
        hoursFromNow: -30,
        durationHours: 6,
      },
    ];
  }

  private manifests(): ManifestSeed[] {
    return [
      ...this.openManifests(),
      ...this.readyManifests(),
      ...this.assignedManifests(),
      ...this.loadingManifests(),
      ...this.inTransitManifests(),
      ...this.completedManifests(),
    ];
  }

  private openManifests(): ManifestSeed[] {
    return [
      this.manifest('1501', 0, ORG_UNIT_NAME.MASARAT_HUB, ORG_UNIT_NAME.MASARAT_IDLIB, ManifestStatus.OPEN, null, ['00000000-0000-7000-8000-000000001129'], ManifestItemStatus.PENDING_LOAD),
      this.manifest('1502', 0, ORG_UNIT_NAME.MASARAT_HUB, ORG_UNIT_NAME.MASARAT_SWEIDA, ManifestStatus.OPEN, null, ['00000000-0000-7000-8000-000000001128'], ManifestItemStatus.PENDING_LOAD),
      this.manifest('1503', 0, ORG_UNIT_NAME.MASARAT_JARAMANA, ORG_UNIT_NAME.MASARAT_HAMA, ManifestStatus.OPEN, null, ['00000000-0000-7000-8000-000000001127'], ManifestItemStatus.PENDING_LOAD),
      this.manifest('1504', 1, ORG_UNIT_NAME.QADMOUS_HUB, ORG_UNIT_NAME.QADMOUS_HAMA, ManifestStatus.OPEN, null, ['00000000-0000-7000-8000-000000001104'], ManifestItemStatus.PENDING_LOAD),
      this.manifest('1505', 2, ORG_UNIT_NAME.TROJAN_DAMASCUS, ORG_UNIT_NAME.TROJAN_RAQQA, ManifestStatus.OPEN, null, ['00000000-0000-7000-8000-000000001134'], ManifestItemStatus.PENDING_LOAD),
    ];
  }

  private readyManifests(): ManifestSeed[] {
    return [
      this.manifest('1506', 0, ORG_UNIT_NAME.MASARAT_HUB, ORG_UNIT_NAME.MASARAT_HASAKAH, ManifestStatus.READY_FOR_DISPATCH, null, ['00000000-0000-7000-8000-000000001130'], ManifestItemStatus.PENDING_LOAD),
      this.manifest('1507', 0, ORG_UNIT_NAME.MASARAT_WAREHOUSE, ORG_UNIT_NAME.MASARAT_TARTOUS, ManifestStatus.READY_FOR_DISPATCH, null, ['00000000-0000-7000-8000-000000001121', '00000000-0000-7000-8000-000000001142'], ManifestItemStatus.PENDING_LOAD),
      this.manifest('1508', 0, ORG_UNIT_NAME.MASARAT_LATAKIA, ORG_UNIT_NAME.MASARAT_HUB, ManifestStatus.READY_FOR_DISPATCH, null, ['00000000-0000-7000-8000-000000001123'], ManifestItemStatus.PENDING_LOAD),
      this.manifest('1509', 1, ORG_UNIT_NAME.QADMOUS_DAMASCUS, ORG_UNIT_NAME.QADMOUS_ALEPPO, ManifestStatus.READY_FOR_DISPATCH, null, ['00000000-0000-7000-8000-000000001132'], ManifestItemStatus.PENDING_LOAD),
      this.manifest('1510', 2, ORG_UNIT_NAME.TROJAN_HUB, ORG_UNIT_NAME.TROJAN_HOMS, ManifestStatus.READY_FOR_DISPATCH, null, ['00000000-0000-7000-8000-000000001133'], ManifestItemStatus.PENDING_LOAD),
    ];
  }

  private assignedManifests(): ManifestSeed[] {
    return [
      this.manifest('1511', 0, ORG_UNIT_NAME.MASARAT_HUB, ORG_UNIT_NAME.MASARAT_ALEPPO, ManifestStatus.ASSIGNED, '00000000-0000-7000-8000-000000001401', ['00000000-0000-7000-8000-000000001120'], ManifestItemStatus.PENDING_LOAD),
      this.manifest('1512', 0, ORG_UNIT_NAME.MASARAT_HUB, ORG_UNIT_NAME.MASARAT_ALEPPO, ManifestStatus.ASSIGNED, '00000000-0000-7000-8000-000000001401', ['00000000-0000-7000-8000-000000001110'], ManifestItemStatus.PENDING_LOAD),
      this.manifest('1513', 0, ORG_UNIT_NAME.MASARAT_HUB, ORG_UNIT_NAME.MASARAT_LATAKIA, ManifestStatus.ASSIGNED, '00000000-0000-7000-8000-000000001250', ['00000000-0000-7000-8000-000000001115'], ManifestItemStatus.PENDING_LOAD),
      this.manifest('1514', 0, ORG_UNIT_NAME.MASARAT_HUB, ORG_UNIT_NAME.MASARAT_LATAKIA, ManifestStatus.ASSIGNED, '00000000-0000-7000-8000-000000001250', ['00000000-0000-7000-8000-000000001139'], ManifestItemStatus.PENDING_LOAD),
    ];
  }

  private loadingManifests(): ManifestSeed[] {
    const loading = 'LOADING' as ManifestStatus;
    return [
      this.manifest('1515', 0, ORG_UNIT_NAME.MASARAT_HUB, ORG_UNIT_NAME.MASARAT_DARAA, loading, '00000000-0000-7000-8000-000000001403', ['00000000-0000-7000-8000-000000001118'], ManifestItemStatus.LOADED),
      this.manifest('1516', 0, ORG_UNIT_NAME.MASARAT_HUB, ORG_UNIT_NAME.MASARAT_DARAA, loading, '00000000-0000-7000-8000-000000001403', ['00000000-0000-7000-8000-000000001137'], ManifestItemStatus.PENDING_LOAD),
      this.manifest('1517', 0, ORG_UNIT_NAME.MASARAT_JARAMANA, ORG_UNIT_NAME.MASARAT_DARAA, loading, '00000000-0000-7000-8000-000000001403', ['00000000-0000-7000-8000-000000001124'], ManifestItemStatus.LOADED),
    ];
  }

  private inTransitManifests(): ManifestSeed[] {
    return [
      this.manifest('1211', 0, ORG_UNIT_NAME.MASARAT_HUB, ORG_UNIT_NAME.MASARAT_ALEPPO, ManifestStatus.IN_TRANSIT, '00000000-0000-7000-8000-000000001201', ['00000000-0000-7000-8000-000000001101', '00000000-0000-7000-8000-000000001102', '00000000-0000-7000-8000-000000001111'], ManifestItemStatus.LOADED),
      this.manifest('1518', 0, ORG_UNIT_NAME.MASARAT_HUB, ORG_UNIT_NAME.MASARAT_ALEPPO, ManifestStatus.IN_TRANSIT, '00000000-0000-7000-8000-000000001201', ['00000000-0000-7000-8000-000000001112', '00000000-0000-7000-8000-000000001119'], ManifestItemStatus.LOADED),
      this.manifest('1519', 0, ORG_UNIT_NAME.MASARAT_HUB, ORG_UNIT_NAME.MASARAT_ALEPPO, ManifestStatus.IN_TRANSIT, '00000000-0000-7000-8000-000000001201', ['00000000-0000-7000-8000-000000001138'], ManifestItemStatus.LOADED),
      this.manifest('1520', 0, ORG_UNIT_NAME.MASARAT_HOMS, ORG_UNIT_NAME.MASARAT_ALEPPO, ManifestStatus.IN_TRANSIT, '00000000-0000-7000-8000-000000001405', ['00000000-0000-7000-8000-000000001122'], ManifestItemStatus.LOADED),
      this.manifest('1521', 1, ORG_UNIT_NAME.QADMOUS_HUB, ORG_UNIT_NAME.QADMOUS_HOMS, ManifestStatus.IN_TRANSIT, '00000000-0000-7000-8000-000000001406', ['00000000-0000-7000-8000-000000001116', '00000000-0000-7000-8000-000000001131'], ManifestItemStatus.LOADED),
      this.manifest('1522', 1, ORG_UNIT_NAME.QADMOUS_HUB, ORG_UNIT_NAME.QADMOUS_HOMS, ManifestStatus.IN_TRANSIT, '00000000-0000-7000-8000-000000001406', ['00000000-0000-7000-8000-000000001141'], ManifestItemStatus.LOADED),
      this.manifest('1523', 2, ORG_UNIT_NAME.TROJAN_HUB, ORG_UNIT_NAME.TROJAN_DAMASCUS, ManifestStatus.IN_TRANSIT, '00000000-0000-7000-8000-000000001407', ['00000000-0000-7000-8000-000000001105'], ManifestItemStatus.LOADED),
    ];
  }

  private completedManifests(): ManifestSeed[] {
    return [
      this.manifest('1253', 0, ORG_UNIT_NAME.MASARAT_HUB, ORG_UNIT_NAME.MASARAT_HOMS, ManifestStatus.COMPLETED, '00000000-0000-7000-8000-000000001252', ['00000000-0000-7000-8000-000000001122'], ManifestItemStatus.UNLOADED),
      this.manifest('1524', 0, ORG_UNIT_NAME.MASARAT_HUB, ORG_UNIT_NAME.MASARAT_HOMS, ManifestStatus.COMPLETED, '00000000-0000-7000-8000-000000001252', ['00000000-0000-7000-8000-000000001117', '00000000-0000-7000-8000-000000001135'], ManifestItemStatus.UNLOADED),
      this.manifest('1525', 0, ORG_UNIT_NAME.MASARAT_ALEPPO, ORG_UNIT_NAME.MASARAT_HUB, ManifestStatus.COMPLETED, '00000000-0000-7000-8000-000000001410', ['00000000-0000-7000-8000-000000001114'], ManifestItemStatus.UNLOADED),
      this.manifest('1526', 0, ORG_UNIT_NAME.MASARAT_ALEPPO, ORG_UNIT_NAME.MASARAT_HUB, ManifestStatus.COMPLETED, '00000000-0000-7000-8000-000000001410', ['00000000-0000-7000-8000-000000001113'], ManifestItemStatus.UNLOADED),
      this.manifest('1527', 2, ORG_UNIT_NAME.TROJAN_RAQQA, ORG_UNIT_NAME.TROJAN_DAMASCUS, ManifestStatus.COMPLETED, '00000000-0000-7000-8000-000000001411', ['00000000-0000-7000-8000-000000001126'], ManifestItemStatus.UNLOADED),
      this.manifest('1528', 1, ORG_UNIT_NAME.QADMOUS_HOMS, ORG_UNIT_NAME.QADMOUS_HUB, ManifestStatus.COMPLETED, '00000000-0000-7000-8000-000000001412', ['00000000-0000-7000-8000-000000001103'], ManifestItemStatus.UNLOADED),
    ];
  }

  private manifest(
    suffix: string,
    tenantIndex: number,
    originName: string,
    destName: string,
    status: ManifestStatus,
    tripId: string | null,
    parcelIds: string[],
    itemStatus: ManifestItemStatus,
  ): ManifestSeed {
    return {
      id: `00000000-0000-7000-8000-00000000${suffix}`,
      tenantIndex,
      originName,
      destName,
      status,
      tripId,
      parcelIds,
      itemStatus,
    };
  }

  private async upsertTrip(seed: TripSeed): Promise<void> {
    const tenant = SEEDED_TENANTS[seed.tenantIndex];
    const driver = await this.prisma.employee.findFirst({
      where: { tenant_id: tenant.id, employee_code: seed.driverCode },
    });
    const origin = await this.prisma.organization_unit.findFirst({
      where: { tenant_id: tenant.id, name: seed.originName },
    });
    const destination = await this.prisma.organization_unit.findFirst({
      where: { tenant_id: tenant.id, name: seed.destName },
    });
    if (!driver || !origin || !destination) {
      this.logger.warn(`Skipping trip ${seed.id}: missing driver/org unit`);
      return;
    }

    const assignment = await this.prisma.vehicle_assignment.findFirst({
      where: { employee_id: driver.id, is_active: true },
    });

    const scheduledAt = new Date(Date.now() + seed.hoursFromNow * 60 * 60 * 1000);
    const startedAt =
      seed.status === TripStatus.SCHEDULED ? null : scheduledAt;
    const endedAt =
      seed.status === TripStatus.COMPLETED
        ? new Date(scheduledAt.getTime() + (seed.durationHours ?? 8) * 60 * 60 * 1000)
        : null;

    await this.prisma.trip.upsert({
      where: { id: seed.id },
      update: {
        driver_id: driver.id,
        vehicle_id: assignment?.vehicle_id ?? null,
        status: seed.status,
        origin_org_unit_id: origin.id,
        destination_org_unit_id: destination.id,
        scheduled_at: scheduledAt,
        started_at: startedAt,
        ended_at: endedAt,
      },
      create: {
        id: seed.id,
        tenant_id: tenant.id,
        driver_id: driver.id,
        vehicle_id: assignment?.vehicle_id ?? null,
        origin_org_unit_id: origin.id,
        destination_org_unit_id: destination.id,
        status: seed.status,
        scheduled_at: scheduledAt,
        started_at: startedAt,
        ended_at: endedAt,
      },
    });
  }

  private async upsertManifest(seed: ManifestSeed): Promise<void> {
    const tenant = SEEDED_TENANTS[seed.tenantIndex];
    const origin = await this.prisma.organization_unit.findFirst({
      where: { tenant_id: tenant.id, name: seed.originName },
    });
    const destination = await this.prisma.organization_unit.findFirst({
      where: { tenant_id: tenant.id, name: seed.destName },
    });
    const creator = await this.prisma.employee.findFirst({
      where: { tenant_id: tenant.id },
      orderBy: { employee_code: 'asc' },
    });
    if (!origin || !destination) {
      this.logger.warn(`Skipping manifest ${seed.id}: missing org units`);
      return;
    }

    const manifest = await this.prisma.transport_manifest.upsert({
      where: { id: seed.id },
      update: {
        trip_id: seed.tripId,
        status: seed.status,
        origin_org_unit_id: origin.id,
        destination_org_unit_id: destination.id,
      },
      create: {
        id: seed.id,
        tenant_id: tenant.id,
        trip_id: seed.tripId,
        origin_org_unit_id: origin.id,
        destination_org_unit_id: destination.id,
        status: seed.status,
        created_by_employee_id: creator?.id,
        created_by_employee_name: creator?.full_name,
      },
    });

    for (const parcelId of seed.parcelIds) {
      const parcel = await this.prisma.parcel.findUnique({ where: { id: parcelId } });
      if (!parcel) {
        this.logger.warn(`Skipping manifest item ${seed.id}/${parcelId}: parcel missing`);
        continue;
      }

      const loaded =
        seed.itemStatus === ManifestItemStatus.LOADED ||
        seed.itemStatus === ManifestItemStatus.UNLOADED;
      await this.prisma.manifest_item.upsert({
        where: {
          manifest_id_parcel_id: {
            manifest_id: manifest.id,
            parcel_id: parcel.id,
          },
        },
        update: {
          status: seed.itemStatus,
          loaded_at: loaded ? new Date() : null,
          unloaded_at: seed.itemStatus === ManifestItemStatus.UNLOADED ? new Date() : null,
        },
        create: {
          manifest_id: manifest.id,
          parcel_id: parcel.id,
          status: seed.itemStatus,
          loaded_at: loaded ? new Date() : null,
          unloaded_at: seed.itemStatus === ManifestItemStatus.UNLOADED ? new Date() : null,
        },
      });
    }
  }

  private async seedProofAndMovement(): Promise<void> {
    const tenant = SEEDED_TENANTS[0];
    const driver = await this.prisma.employee.findFirst({
      where: { tenant_id: tenant.id, employee_code: 'EMP-102' },
    });
    const origin = await this.prisma.organization_unit.findFirst({
      where: { tenant_id: tenant.id, name: ORG_UNIT_NAME.MASARAT_HUB },
    });
    const parcel1 = await this.prisma.parcel.findUnique({
      where: { id: '00000000-0000-7000-8000-000000001101' },
    });
    const deliveredParcel = await this.prisma.parcel.findUnique({
      where: { id: '00000000-0000-7000-8000-000000001107' },
    });

    if (driver && origin && parcel1) {
      await this.prisma.parcel_movement.upsert({
        where: { id: '00000000-0000-7000-8000-000000001231' },
        update: {
          action_type: ActionType.LOADED_ON_TRIP,
          performed_by_name: driver.full_name,
          notes: 'تم تحميل الطرد على رحلة دمشق — حلب',
          organization_unit_name: origin.name,
          organization_type: origin.org_type,
        },
        create: {
          tenant_id: tenant.id,
          parcel_id: parcel1.id,
          organization_unit_id: origin.id,
          trip_id: '00000000-0000-7000-8000-000000001201',
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
    }

    if (driver && deliveredParcel) {
      await this.prisma.proof_of_delivery.upsert({
        where: { parcel_id: deliveredParcel.id },
        update: {
          received_by_name: 'هبة محمد عطري',
          otp_verified: true,
        },
        create: {
          tenant_id: tenant.id,
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
  }
}
