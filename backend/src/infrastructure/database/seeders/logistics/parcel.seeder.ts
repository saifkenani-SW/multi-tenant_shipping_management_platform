import { Injectable, Logger } from '@nestjs/common';
import { ParcelCondition, ParcelStatus, ParcelType } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';

const PARCELS = [
  {
    id: '00000000-0000-7000-8000-000000001101',
    shipmentId: '00000000-0000-7000-8000-000000000821',
    trackingNumber: 'SHAM-2026-0001',
    description: 'كرتون ملابس شتوية',
    category: 'ملابس',
    weight: 2.5,
    length: 40,
    width: 30,
    height: 20,
    status: ParcelStatus.IN_TRANSIT,
    fragile: false,
  },
  {
    id: '00000000-0000-7000-8000-000000001102',
    shipmentId: '00000000-0000-7000-8000-000000000821',
    trackingNumber: 'SHAM-2026-0002',
    description: 'مستلزمات منزلية وأدوات مطبخ',
    category: 'منزلية',
    weight: 3.0,
    length: 35,
    width: 25,
    height: 18,
    status: ParcelStatus.IN_TRANSIT,
    fragile: true,
  },
  {
    id: '00000000-0000-7000-8000-000000001107',
    shipmentId: '00000000-0000-7000-8000-000000000824',
    trackingNumber: 'SHAM-2026-0003',
    description: 'طرد مستحضرات تجميل',
    category: 'تجميل',
    weight: 3.2,
    length: 25,
    width: 20,
    height: 12,
    status: ParcelStatus.COLLECTED,
    fragile: true,
  },
  {
    id: '00000000-0000-7000-8000-000000001103',
    shipmentId: '00000000-0000-7000-8000-000000000822',
    trackingNumber: 'BRDA-2026-0001',
    description: 'مستندات تجارية وكتالوجات',
    category: 'مستندات',
    weight: 1.5,
    length: 30,
    width: 22,
    height: 8,
    status: ParcelStatus.PROCESSING,
    fragile: false,
  },
  {
    id: '00000000-0000-7000-8000-000000001104',
    shipmentId: '00000000-0000-7000-8000-000000000822',
    trackingNumber: 'BRDA-2026-0002',
    description: 'عينات أقمشة',
    category: 'أقمشة',
    weight: 2.5,
    length: 40,
    width: 20,
    height: 10,
    status: ParcelStatus.PROCESSING,
    fragile: false,
  },
  {
    id: '00000000-0000-7000-8000-000000001105',
    shipmentId: '00000000-0000-7000-8000-000000000823',
    trackingNumber: 'FRAT-2026-0001',
    description: 'أغذية مجففة وتمر ديري',
    category: 'أغذية',
    weight: 6.8,
    length: 40,
    width: 30,
    height: 25,
    status: ParcelStatus.READY_FOR_COLLECTION,
    fragile: false,
  },
  {
    id: '00000000-0000-7000-8000-000000001110',
    shipmentId: '00000000-0000-7000-8000-000000000870',
    trackingNumber: 'SHAM-2026-0004',
    description: 'غلاية كهربائية ومكواة',
    category: 'كهربائيات',
    weight: 4.4,
    length: 35,
    width: 28,
    height: 22,
    status: ParcelStatus.READY_FOR_DISPATCH,
    fragile: true,
  },
  {
    id: '00000000-0000-7000-8000-000000001111',
    shipmentId: '00000000-0000-7000-8000-000000000871',
    trackingNumber: 'SHAM-2026-0005',
    description: 'كرتون أدوية ومستلزمات صيدلية',
    category: 'أدوية',
    weight: 4.0,
    length: 30,
    width: 25,
    height: 20,
    status: ParcelStatus.IN_TRANSIT,
    fragile: true,
  },
  {
    id: '00000000-0000-7000-8000-000000001112',
    shipmentId: '00000000-0000-7000-8000-000000000871',
    trackingNumber: 'SHAM-2026-0006',
    description: 'عبوات سيرومات',
    category: 'أدوية',
    weight: 3.1,
    length: 28,
    width: 20,
    height: 18,
    status: ParcelStatus.IN_TRANSIT,
    fragile: true,
  },
  {
    id: '00000000-0000-7000-8000-000000001113',
    shipmentId: '00000000-0000-7000-8000-000000000872',
    trackingNumber: 'SHAM-2026-0007',
    description: 'طرد ملابس جاهزة',
    category: 'ملابس',
    weight: 2.8,
    length: 40,
    width: 30,
    height: 15,
    status: ParcelStatus.READY_FOR_COLLECTION,
    fragile: false,
  },
  {
    id: '00000000-0000-7000-8000-000000001114',
    shipmentId: '00000000-0000-7000-8000-000000000873',
    trackingNumber: 'SHAM-2026-0008',
    description: 'أقمشة حرير حلبي',
    category: 'أقمشة',
    weight: 9.5,
    length: 50,
    width: 30,
    height: 20,
    status: ParcelStatus.COLLECTED,
    fragile: false,
  },
  {
    id: '00000000-0000-7000-8000-000000001115',
    shipmentId: '00000000-0000-7000-8000-000000000874',
    trackingNumber: 'SHAM-2026-0009',
    description: 'كرتون كتب مدرسية',
    category: 'قرطاسية',
    weight: 6.0,
    length: 40,
    width: 30,
    height: 25,
    status: ParcelStatus.PROCESSING,
    fragile: false,
  },
  {
    id: '00000000-0000-7000-8000-000000001116',
    shipmentId: '00000000-0000-7000-8000-000000000876',
    trackingNumber: 'BRDA-2026-0003',
    description: 'مواد غذائية معلبة',
    category: 'أغذية',
    weight: 5.2,
    length: 38,
    width: 28,
    height: 22,
    status: ParcelStatus.IN_TRANSIT,
    fragile: false,
  },
] as const;

@Injectable()
export class ParcelSeeder implements Seeder {
  private readonly logger = new Logger(ParcelSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting ParcelSeeder...');

    for (const p of PARCELS) {
      const shipment = await this.prisma.customer_shipment.findUnique({
        where: { id: p.shipmentId },
      });

      if (!shipment) {
        this.logger.warn(
          `Skipping parcel ${p.trackingNumber}: shipment not found`,
        );
        continue;
      }

      const dest = await this.prisma.organization_unit.findUnique({
        where: { id: shipment.destination_org_unit_id },
      });

      await this.prisma.parcel.upsert({
        where: { id: p.id },
        update: {
          tracking_number: p.trackingNumber,
          description: p.description,
          category: p.category,
          current_status: p.status,
          current_condition: ParcelCondition.NORMAL,
          current_org_unit_id: dest?.id ?? shipment.origin_org_unit_id,
          destination_org_unit_id: shipment.destination_org_unit_id,
          is_fragile: p.fragile,
        },
        create: {
          id: p.id,
          tenant_id: shipment.tenant_id,
          customer_shipment_id: shipment.id,
          tracking_number: p.trackingNumber,
          description: p.description,
          category: p.category,
          parcel_type: ParcelType.PACKAGE,
          is_fragile: p.fragile,
          actual_weight_kg: p.weight,
          length_cm: p.length,
          width_cm: p.width,
          height_cm: p.height,
          volumetric_weight_kg: (p.length * p.width * p.height) / 5000,
          current_status: p.status,
          current_condition: ParcelCondition.NORMAL,
          current_org_unit_id: dest?.id ?? shipment.origin_org_unit_id,
          destination_org_unit_id: shipment.destination_org_unit_id,
        },
      });
    }

    this.logger.log('ParcelSeeder completed.');
  }
}
