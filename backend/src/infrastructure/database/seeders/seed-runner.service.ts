import { Injectable, Logger } from '@nestjs/common';
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
import { Seeder } from './seeder.interface';
import { SupportNotificationSeeder } from './support/support-notification.seeder';
import { GlobalLocationSeeder } from './system/global-location.seeder';
import { PermissionSeeder } from './system/permission.seeder';
import { PlatformOwnerSeeder } from './system/platform-owner.seeder';
import { SubscriptionPlanSeeder } from './system/subscription-plan.seeder';
import { UserSeeder } from './system/user.seeder';
import { TenantSeeder } from './tenant/tenant.seeder';
import { SuperUserSeeder } from './demo/super-user.seeder';

@Injectable()
export class SeedRunner {
  private readonly logger = new Logger(SeedRunner.name);

  constructor(
    private readonly permissionSeeder: PermissionSeeder,
    private readonly subscriptionPlanSeeder: SubscriptionPlanSeeder,
    private readonly platformOwnerSeeder: PlatformOwnerSeeder,
    private readonly userSeeder: UserSeeder,
    private readonly globalLocationSeeder: GlobalLocationSeeder,
    private readonly tenantSeeder: TenantSeeder,
    private readonly roleSeeder: RoleSeeder,
    private readonly zoneSeeder: ZoneSeeder,
    private readonly organizationUnitSeeder: OrganizationUnitSeeder,
    private readonly employeeSeeder: EmployeeSeeder,
    private readonly customerSeeder: CustomerSeeder,
    private readonly shipmentRequestSeeder: ShipmentRequestSeeder,
    private readonly billingSeeder: BillingSeeder,
    private readonly vehicleSeeder: VehicleSeeder,
    private readonly parcelSeeder: ParcelSeeder,
    private readonly tripManifestSeeder: TripManifestSeeder,
    private readonly supportNotificationSeeder: SupportNotificationSeeder,
    private readonly superUserSeeder: SuperUserSeeder,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Starting complete database seeding sequence...');

    const topologicalSeeders: Seeder[] = [
      // 1. System level independent models
      this.permissionSeeder,
      this.subscriptionPlanSeeder,
      this.userSeeder, // users, platform_admin, user_session
      this.platformOwnerSeeder,
      this.globalLocationSeeder, // global_location

      // 2. Tenants & Settings & Subscriptions
      this.tenantSeeder, // tenant, tenant_*_settings, tenant_subscription, history

      // 3. RBAC & Geography
      this.roleSeeder, // role, role_permission
      this.zoneSeeder, // tenant_zone, zone_pricing_matrix
      this.organizationUnitSeeder, // organization_unit, org_unit_location_mapping
      this.employeeSeeder, // employee, employee_assignment, assignment_role

      // 4. Customers & Profiles
      this.customerSeeder, // customer_profile, customer_address, customer_tenant

      // 5. Requests, Quotations, Shipments & Billing
      this.shipmentRequestSeeder, // shipment_request, quotation, customer_shipment
      this.billingSeeder, // invoice, payment
      this.vehicleSeeder, // vehicle
      this.parcelSeeder, // parcel

      // 6. Logistics Operations & Manifests
      this.tripManifestSeeder, // trip, transport_manifest, manifest_item, parcel_movement, proof_of_delivery

      // 7. Support, Notifications & Audit Logs
      this.supportNotificationSeeder, // support_ticket, support_ticket_message, notification, audit_log

      // 8. Demo Accounts
      this.superUserSeeder,
    ];

    await this.runSeeders(topologicalSeeders);

    this.logger.log('Seeding completed successfully across all models.');
  }

  private async runSeeders(seeders: Seeder[]): Promise<void> {
    for (const seeder of seeders) {
      try {
        await seeder.seed();
      } catch (error) {
        this.logger.error(
          `Seeder ${seeder.constructor.name} failed.`,
          error instanceof Error ? error.stack : String(error),
        );
        throw error;
      }
    }
  }
}
