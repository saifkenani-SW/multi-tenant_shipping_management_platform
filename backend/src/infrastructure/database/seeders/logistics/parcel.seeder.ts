import { Injectable, Logger } from '@nestjs/common';
import { ParcelCondition, ParcelStatus } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';

@Injectable()
export class ParcelSeeder implements Seeder {
  private readonly logger = new Logger(ParcelSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting ParcelSeeder...');

    const tenant1 = SEEDED_TENANTS[0];
    const shipment = await this.prisma.customer_shipment.findFirst({
      where: { tenant_id: tenant1.id },
    });
    const orgUnit = await this.prisma.organization_unit.findFirst({
      where: { tenant_id: tenant1.id },
    });

    if (!shipment || !orgUnit) {
      this.logger.warn('Skipping ParcelSeeder: missing shipment/orgUnit');
      return;
    }

    const parcels = [
      {
        id: '00000000-0000-7000-8000-000000001101',
        trackingNumber: 'TRK-2026-0001',
        weight: 2.5,
        length: 20,
        width: 15,
        height: 10,
      },
      {
        id: '00000000-0000-7000-8000-000000001102',
        trackingNumber: 'TRK-2026-0002',
        weight: 3.0,
        length: 25,
        width: 20,
        height: 12,
      },
    ];

    for (const p of parcels) {
      await this.prisma.parcel.upsert({
        where: { tracking_number: p.trackingNumber },
        update: {
          current_status: ParcelStatus.IN_TRANSIT,
          current_condition: ParcelCondition.NORMAL,
          current_org_unit_id: orgUnit.id,
        },
        create: {
          id: p.id,
          tenant_id: tenant1.id,
          customer_shipment_id: shipment.id,
          tracking_number: p.trackingNumber,
          actual_weight_kg: p.weight,
          length_cm: p.length,
          width_cm: p.width,
          height_cm: p.height,
          volumetric_weight_kg: (p.length * p.width * p.height) / 5000,
          current_status: ParcelStatus.IN_TRANSIT,
          current_condition: ParcelCondition.NORMAL,
          current_org_unit_id: orgUnit.id,
          qr_code_url: `https://cdn.fastship.com/qr/${p.trackingNumber}.png`,
        },
      });
    }

    this.logger.log('ParcelSeeder completed.');
  }
}
