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

    for (let i = 0; i < SEEDED_TENANTS.length; i++) {
      const tenant = SEEDED_TENANTS[i];
      const shipment = await this.prisma.customer_shipment.findFirst({
        where: { tenant_id: tenant.id },
      });
      const orgUnit = await this.prisma.organization_unit.findFirst({
        where: { tenant_id: tenant.id, org_type: 'BRANCH' },
      });

      if (!shipment || !orgUnit) {
        this.logger.warn(
          `Skipping ParcelSeeder for tenant ${tenant.name}: missing shipment/orgUnit`,
        );
        continue;
      }

      const id1 = `00000000-0000-7000-8000-0000000011${(i * 2 + 1).toString().padStart(2, '0')}`;
      const id2 = `00000000-0000-7000-8000-0000000011${(i * 2 + 2).toString().padStart(2, '0')}`;
      const trk1 = `TRK-2026-${(i * 2 + 1).toString().padStart(4, '0')}`;
      const trk2 = `TRK-2026-${(i * 2 + 2).toString().padStart(4, '0')}`;

      const parcels = [
        {
          id: id1,
          trackingNumber: trk1,
          weight: 2.5,
          length: 20,
          width: 15,
          height: 10,
        },
        {
          id: id2,
          trackingNumber: trk2,
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
            tenant_id: tenant.id,
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
          },
        });
      }
    }

    this.logger.log('ParcelSeeder completed.');
  }
}
