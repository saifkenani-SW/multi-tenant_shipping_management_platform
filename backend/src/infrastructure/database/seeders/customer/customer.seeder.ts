import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';

@Injectable()
export class CustomerSeeder implements Seeder {
  private readonly logger = new Logger(CustomerSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting CustomerSeeder...');

    const customerUser1 = await this.prisma.users.findUnique({
      where: { email: 'john.doe@email.com' },
    });
    const customerUser2 = await this.prisma.users.findUnique({
      where: { email: 'jane.smith@email.com' },
    });

    if (!customerUser1 || !customerUser2) {
      this.logger.warn('Skipping CustomerSeeder: customer users not found');
      return;
    }

    const customersToSeed = [
      {
        id: '00000000-0000-7000-8000-000000000701',
        user_id: customerUser1.id,
        full_name: 'John Doe',
        phone: customerUser1.phone || '+1230000001',
        address: 'Building 12, Olaya Street, Riyadh',
        lat: 24.6901,
        lng: 46.6853,
      },
      {
        id: '00000000-0000-7000-8000-000000000702',
        user_id: customerUser2.id,
        full_name: 'Jane Smith',
        phone: customerUser2.phone || '+1230000002',
        address: 'Villa 45, Tahlia Street, Riyadh',
        lat: 24.7001,
        lng: 46.6953,
      },
    ];

    const tenant1 = SEEDED_TENANTS[0];

    for (let i = 0; i < customersToSeed.length; i++) {
      const cData = customersToSeed[i];

      const profile = await this.prisma.customer_profile.upsert({
        where: { user_id: cData.user_id },
        update: {
          full_name: cData.full_name,
          phone: cData.phone,
        },
        create: {
          id: cData.id,
          user_id: cData.user_id,
          full_name: cData.full_name,
          phone: cData.phone,
        },
      });

      // Customer Address
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
            'Home',
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
            label = 'Home',
            address_line = ${cData.address},
            is_default = true,
            location = ST_SetSRID(ST_MakePoint(${cData.lng}, ${cData.lat}), 4326)
          WHERE id = ${addressId}::uuid
        `;
      }

      // Customer Tenant
      const custTenantId = `00000000-0000-7000-8000-00000000078${i}`;
      await this.prisma.customer_tenant.upsert({
        where: {
          tenant_id_customer_profile_id: {
            tenant_id: tenant1.id,
            customer_profile_id: profile.id,
          },
        },
        update: {},
        create: {
          id: custTenantId,
          tenant_id: tenant1.id,
          customer_profile_id: profile.id,
        },
      });
    }

    this.logger.log('CustomerSeeder completed.');
  }
}
