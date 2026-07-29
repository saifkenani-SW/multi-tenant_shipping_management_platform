import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { DatabaseModule } from '../database.module';
import { CustomerSeeder } from './customer/customer.seeder';
import { ZoneSeeder } from './geography/zone.seeder';
import { BillingSeeder } from './logistics/billing.seeder';
import { ParcelSeeder } from './logistics/parcel.seeder';
import { ShipmentRequestSeeder } from './logistics/shipment-request.seeder';
import { TripManifestSeeder } from './logistics/trip-manifest.seeder';
import { VehicleSeeder } from './logistics/vehicle.seeder';
import { EmployeeSeeder } from './rbac/employee.seeder';
import { OrganizationUnitSeeder } from './rbac/organization-unit.seeder';
import { RoleSeeder } from './rbac/role.seeder';
import { SeedRunner } from './seed-runner.service';
import { SupportNotificationSeeder } from './support/support-notification.seeder';
import { GlobalLocationSeeder } from './system/global-location.seeder';
import { PermissionSeeder } from './system/permission.seeder';
import { PlatformOwnerSeeder } from './system/platform-owner.seeder';
import { SubscriptionPlanSeeder } from './system/subscription-plan.seeder';
import { UserSeeder } from './system/user.seeder';
import { TenantSeeder } from './tenant/tenant.seeder';

const SEEDERS = [
  SeedRunner,
  PermissionSeeder,
  SubscriptionPlanSeeder,
  PlatformOwnerSeeder,
  UserSeeder,
  GlobalLocationSeeder,
  TenantSeeder,
  RoleSeeder,
  ZoneSeeder,
  OrganizationUnitSeeder,
  EmployeeSeeder,
  CustomerSeeder,
  ShipmentRequestSeeder,
  BillingSeeder,
  VehicleSeeder,
  ParcelSeeder,
  TripManifestSeeder,
  SupportNotificationSeeder,
];

@Module({
  imports: [AppConfigModule, DatabaseModule],
  providers: SEEDERS,
  exports: SEEDERS,
})
export class SeederModule {}
