import { Injectable, Logger } from '@nestjs/common';
import { Currency, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';

export const SEEDED_TENANTS = [
  {
    id: '00000000-0000-7000-8000-000000000101',
    name: 'مسارات',
    email: 'info@masarat.sy',
    owner_email: 'admin@fastship.com',
    phone: '+963112313131',
    tax_number: '12345678-1',
    logo_url: null,
    tracking_prefix: 'MSRT',
  },
  {
    id: '00000000-0000-7000-8000-000000000102',
    name: 'القدومس',
    email: 'info@qadmous.sy',
    owner_email: 'admin@quickdelivery.com',
    phone: '+963433161616',
    tax_number: '23456789-2',
    logo_url: null,
    tracking_prefix: 'QADM',
  },
  {
    id: '00000000-0000-7000-8000-000000000103',
    name: 'طروادة',
    email: 'info@trojan.sy',
    owner_email: 'admin@globalfreight.com',
    phone: '+963112244880',
    tax_number: '34567890-3',
    logo_url: null,
    tracking_prefix: 'TRWD',
  },
] as const;

const PLAN_ID = '00000000-0000-7000-8000-000000000003';

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
          tracking_prefix: t.tracking_prefix,
          auto_close_shipment_after_collection: true,
          quotation_validity_hours: 48,
        },
        create: {
          tenant_id: t.id,
          tracking_prefix: t.tracking_prefix,
          auto_close_shipment_after_collection: true,
          quotation_validity_hours: 48,
        },
      });

      const volumetricDivisor = 5000;

      await this.prisma.tenant_pricing_settings.upsert({
        where: { tenant_id: t.id },
        update: {
          volumetric_divisor: volumetricDivisor,
          default_currency: Currency.SY,
        },
        create: {
          tenant_id: t.id,
          volumetric_divisor: volumetricDivisor,
          default_currency: Currency.SY,
        },
      });

      const subscriptionId = `00000000-0000-7000-8000-0000000001${t.id.slice(-2)}`;
      const sub = await this.prisma.tenant_subscription.upsert({
        where: { id: subscriptionId },
        update: {
          status: SubscriptionStatus.ACTIVE,
          plan_id: PLAN_ID,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          snapshot_max_branches: 50,
          snapshot_max_warehouses: 20,
          snapshot_max_employees: 200,
          snapshot_max_vehicles: 100,
          snapshot_max_zones: 15,
        },
        create: {
          id: subscriptionId,
          tenant_id: t.id,
          plan_id: PLAN_ID,
          status: SubscriptionStatus.ACTIVE,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          snapshot_max_branches: 50,
          snapshot_max_warehouses: 20,
          snapshot_max_employees: 200,
          snapshot_max_vehicles: 100,
          snapshot_max_zones: 15,
        },
      });

      const historyId = `00000000-0000-7000-8000-0000000002${t.id.slice(-2)}`;
      await this.prisma.tenant_subscription_history.upsert({
        where: { id: historyId },
        update: {
          action: 'CREATE',
          notes: 'إنشاء الاشتراك الأولي لخطة الأعمال',
        },
        create: {
          id: historyId,
          tenant_id: t.id,
          subscription_id: sub.id,
          plan_id: PLAN_ID,
          action: 'CREATE',
          notes: 'إنشاء الاشتراك الأولي لخطة الأعمال',
        },
      });

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
