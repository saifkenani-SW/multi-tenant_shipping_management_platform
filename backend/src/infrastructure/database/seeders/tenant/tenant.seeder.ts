import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';

export const SEEDED_TENANTS = [
  {
    id: '00000000-0000-7000-8000-000000000101',
    name: 'FastShip Logistics',
    email: 'info@fastship.com',
    owner_email: 'admin@fastship.com',
    phone: '+1987654321',
    tax_number: 'TAX-001-2024',
    logo_url: 'https://cdn.fastship.com/logo.png',
  },
  {
    id: '00000000-0000-7000-8000-000000000102',
    name: 'QuickDelivery Co.',
    email: 'info@quickdelivery.com',
    owner_email: 'admin@quickdelivery.com',
    phone: '+1122334455',
    tax_number: 'TAX-002-2024',
    logo_url: null,
  },
] as const;

const PLAN_ID = '00000000-0000-7000-8000-000000000002'; // Business plan

@Injectable()
export class TenantSeeder implements Seeder {
  private readonly logger = new Logger(TenantSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting TenantSeeder...');

    for (const t of SEEDED_TENANTS) {
      await this.prisma.tenant.upsert({
        where: { id: t.id },
        update: {
          name: t.name,
          email: t.email,
          phone: t.phone,
          tax_number: t.tax_number,
          logo_url: t.logo_url,
          is_active: true,
        },
        create: {
          id: t.id,
          name: t.name,
          email: t.email,
          phone: t.phone,
          tax_number: t.tax_number,
          logo_url: t.logo_url,
          is_active: true,
        },
      });

      // Tenant Settings
      await this.prisma.tenant_delivery_settings.upsert({
        where: { tenant_id: t.id },
        update: {
          require_otp: true,
          require_signature: true,
          require_proof_photo: true,
        },
        create: {
          tenant_id: t.id,
          require_otp: true,
          require_signature: true,
          require_proof_photo: true,
        },
      });

      await this.prisma.tenant_operational_settings.upsert({
        where: { tenant_id: t.id },
        update: {
          auto_close_shipment_after_collection: true,
          quotation_validity_hours: 48,
        },
        create: {
          tenant_id: t.id,
          auto_close_shipment_after_collection: true,
          quotation_validity_hours: 48,
        },
      });

      await this.prisma.tenant_pricing_settings.upsert({
        where: { tenant_id: t.id },
        update: {
          volumetric_divisor: 5000,
          default_currency: 'USD',
        },
        create: {
          tenant_id: t.id,
          volumetric_divisor: 5000,
          default_currency: 'USD',
        },
      });

      // Tenant Subscriptions
      const subscriptionId = `00000000-0000-7000-8000-0000000001${t.id.slice(-2)}`;
      const sub = await this.prisma.tenant_subscription.upsert({
        where: { id: subscriptionId },
        update: {
          status: SubscriptionStatus.ACTIVE,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        create: {
          id: subscriptionId,
          tenant_id: t.id,
          plan_id: PLAN_ID,
          status: SubscriptionStatus.ACTIVE,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          snapshot_max_branches: 10,
          snapshot_max_warehouses: 5,
          snapshot_max_employees: 50,
          snapshot_max_vehicles: 25,
          snapshot_max_zones: 5,
        },
      });

      // Tenant Subscription History
      const historyId = `00000000-0000-7000-8000-0000000002${t.id.slice(-2)}`;
      await this.prisma.tenant_subscription_history.upsert({
        where: { id: historyId },
        update: {
          action: 'CREATE',
          notes: 'Initial subscription creation',
        },
        create: {
          id: historyId,
          tenant_id: t.id,
          subscription_id: sub.id,
          plan_id: PLAN_ID,
          action: 'CREATE',
          notes: 'Initial subscription creation',
        },
      });

      // Tenant Owner
      const user = await this.prisma.users.findUnique({
        where: { email: t.owner_email },
      });
      if (user) {
        const ownerId = `00000000-0000-7000-8000-0000000003${t.id.slice(-2)}`;
        await this.prisma.tenant_owner.upsert({
          where: {
            tenant_id_user_id: {
              tenant_id: t.id,
              user_id: user.id,
            },
          },
          update: { is_primary: true },
          create: {
            id: ownerId,
            tenant_id: t.id,
            user_id: user.id,
            is_primary: true,
          },
        });
      }
    }

    this.logger.log('TenantSeeder completed.');
  }
}
