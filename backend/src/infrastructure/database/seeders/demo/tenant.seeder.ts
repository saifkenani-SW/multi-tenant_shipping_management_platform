import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';

export const DEMO_TENANTS = [
  {
    id: '00000000-0000-7000-8000-000000000101',
    name: 'FastShip Logistics',
    email: 'info@fastship.com',
    phone: '+1987654321',
    tax_number: 'TAX-001-2024',
    logo_url: 'https://cdn.fastship.com/logo.png',
  },
  {
    id: '00000000-0000-7000-8000-000000000102',
    name: 'QuickDelivery Co.',
    email: 'info@quickdelivery.com',
    phone: '+1122334455',
    tax_number: 'TAX-002-2024',
    logo_url: null,
  },
  {
    id: '00000000-0000-7000-8000-000000000103',
    name: 'Swift Logistics',
    email: 'contact@swiftlogistics.com',
    phone: '+1567890123',
    tax_number: 'TAX-003-2024',
    logo_url: null,
  },
] as const;

@Injectable()
export class TenantSeeder implements Seeder {
  private readonly logger = new Logger(TenantSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting...');

    for (const tenant of DEMO_TENANTS) {
      const { id, ...data } = tenant;

      await this.prisma.tenant.upsert({
        where: { id },
        update: data,
        create: { id, ...data },
      });
    }

    this.logger.log('Completed.');
    this.logger.log(`Number of processed records: ${DEMO_TENANTS.length}.`);
  }
}
