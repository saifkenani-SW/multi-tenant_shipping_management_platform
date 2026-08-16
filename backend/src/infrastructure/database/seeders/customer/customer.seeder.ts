import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';

const CUSTOMERS = [
  {
    id: '00000000-0000-7000-8000-000000000701',
    email: 'john.doe@email.com',
    full_name: 'أحمد خالد الحسن',
    address: 'شارع المهدي بن بركة، بناء 12، أبو رمانة، دمشق',
    label: 'المنزل',
    lat: 33.5186,
    lng: 36.2851,
    tenantIndexes: [0, 1],
  },
  {
    id: '00000000-0000-7000-8000-000000000702',
    email: 'jane.smith@email.com',
    full_name: 'ليلى حسن المصري',
    address: 'المزة فيلات غربية، فيلا 8، دمشق',
    label: 'المنزل',
    lat: 33.5021,
    lng: 36.2544,
    tenantIndexes: [0],
  },
  {
    id: '00000000-0000-7000-8000-000000000703',
    email: 'omar.najjar@email.sy',
    full_name: 'عمر عبد الله نجار',
    address: 'شارع العزيزية، بناء السعد، الطابق 2، حلب',
    label: 'المحل',
    lat: 36.2072,
    lng: 37.1521,
    tenantIndexes: [0, 2],
  },
  {
    id: '00000000-0000-7000-8000-000000000704',
    email: 'hiba.atri@email.sy',
    full_name: 'هبة محمد عطري',
    address: 'المشروع العاشر، بناء 21، اللاذقية',
    label: 'المنزل',
    lat: 35.5208,
    lng: 35.7812,
    tenantIndexes: [1, 2],
  },
  {
    id: '00000000-0000-7000-8000-000000000705',
    email: 'bassam.qabbani@email.sy',
    full_name: 'بسام عدنان القباني',
    address: 'الشعلان، بناء العابد، دمشق',
    label: 'المكتب',
    lat: 33.5148,
    lng: 36.2912,
    tenantIndexes: [0],
  },
  {
    id: '00000000-0000-7000-8000-000000000706',
    email: 'ghadah.hamdan@email.sy',
    full_name: 'غادة سليم حمدان',
    address: 'حي الإنشاءات، شارع الحضارة، حمص',
    label: 'المنزل',
    lat: 34.7281,
    lng: 36.7094,
    tenantIndexes: [0, 1],
  },
  {
    id: '00000000-0000-7000-8000-000000000707',
    email: 'tareq.atasi@email.sy',
    full_name: 'طارق الأتاسي',
    address: 'العزيزية، بناء الكواكبي، حلب',
    label: 'المحل',
    lat: 36.2088,
    lng: 37.1499,
    tenantIndexes: [0],
  },
] as const;

@Injectable()
export class CustomerSeeder implements Seeder {
  private readonly logger = new Logger(CustomerSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting CustomerSeeder...');

    for (let i = 0; i < CUSTOMERS.length; i++) {
      const cData = CUSTOMERS[i];
      const user = await this.prisma.users.findUnique({
        where: { email: cData.email },
      });

      if (!user) {
        this.logger.warn(`Skipping customer ${cData.email}: user not found`);
        continue;
      }

      const profile = await this.prisma.customer_profile.upsert({
        where: { user_id: user.id },
        update: {
          full_name: cData.full_name,
          phone: user.phone || '',
        },
        create: {
          id: cData.id,
          user_id: user.id,
          full_name: cData.full_name,
          phone: user.phone || '',
        },
      });

      const addressId = `00000000-0000-7000-8000-00000000075${i}`;
      const existingAddr = await this.prisma.customer_address.findUnique({
        where: { id: addressId },
      });

      if (!existingAddr) {
        await this.prisma.$executeRaw`
          INSERT INTO customer_address (id, customer_id, label, address_line, is_default, location)
          VALUES (
            ${addressId}::uuid,
            ${profile.id}::uuid,
            ${cData.label},
            ${cData.address},
            true,
            ST_SetSRID(ST_MakePoint(${cData.lng}, ${cData.lat}), 4326)
          )
        `;
      } else {
        await this.prisma.$executeRaw`
          UPDATE customer_address
          SET
            customer_id = ${profile.id}::uuid,
            label = ${cData.label},
            address_line = ${cData.address},
            is_default = true,
            location = ST_SetSRID(ST_MakePoint(${cData.lng}, ${cData.lat}), 4326)
          WHERE id = ${addressId}::uuid
        `;
      }

      for (const tenantIndex of cData.tenantIndexes) {
        const tenant = SEEDED_TENANTS[tenantIndex];
        const custTenantId = `00000000-0000-7000-8000-0000000007${tenantIndex}${i}`;

        await this.prisma.customer_tenant.upsert({
          where: {
            tenant_id_customer_profile_id: {
              tenant_id: tenant.id,
              customer_profile_id: profile.id,
            },
          },
          update: {},
          create: {
            id: custTenantId,
            tenant_id: tenant.id,
            customer_profile_id: profile.id,
          },
        });
      }
    }

    this.logger.log('CustomerSeeder completed.');
  }
}
