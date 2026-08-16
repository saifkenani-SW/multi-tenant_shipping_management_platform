import { Injectable, Logger } from '@nestjs/common';
import { ParcelCondition, ParcelStatus, ParcelType } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';

const PARCELS = [
  {
    id: '00000000-0000-7000-8000-000000001101',
    shipmentId: '00000000-0000-7000-8000-000000000821',
    trackingNumber: 'MSRT-2026-0001',
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
    trackingNumber: 'MSRT-2026-0002',
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
    trackingNumber: 'MSRT-2026-0003',
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
    trackingNumber: 'QADM-2026-0001',
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
    trackingNumber: 'QADM-2026-0002',
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
    trackingNumber: 'TRWD-2026-0001',
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
    trackingNumber: 'MSRT-2026-0004',
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
    trackingNumber: 'MSRT-2026-0005',
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
    trackingNumber: 'MSRT-2026-0006',
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
    trackingNumber: 'MSRT-2026-0007',
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
    trackingNumber: 'MSRT-2026-0008',
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
    trackingNumber: 'MSRT-2026-0009',
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
    trackingNumber: 'QADM-2026-0003',
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

const EXTRA_PARCELS = [
  extraParcel(17, 0, 'كرتون أدوات منزلية', 'منزلية', ParcelStatus.IN_TRANSIT, false),
  extraParcel(18, 1, 'مستلزمات زراعية', 'زراعة', ParcelStatus.PROCESSING, false),
  extraParcel(19, 2, 'أغذية معلبة', 'أغذية', ParcelStatus.IN_TRANSIT, false),
  extraParcel(20, 3, 'طرد ملابس جرمانا', 'ملابس', ParcelStatus.READY_FOR_DISPATCH, false),
  extraParcel(21, 4, 'قطع صناعية', 'صناعة', ParcelStatus.PROCESSING, true),
  extraParcel(22, 5, 'أقمشة حمص — المرحلة الثانية', 'أقمشة', ParcelStatus.IN_TRANSIT, false),
  extraParcel(23, 6, 'سمك معلب', 'أغذية', ParcelStatus.READY_FOR_DISPATCH, false),
  extraParcel(24, 7, 'خضار درعا', 'أغذية', ParcelStatus.PROCESSING, false),
  extraParcel(25, 8, 'تمر ديري', 'أغذية', ParcelStatus.IN_TRANSIT, false),
  extraParcel(26, 9, 'قطن الرقة', 'مواد خام', ParcelStatus.PROCESSING, false),
  extraParcel(27, 10, 'أدوية عاجلة', 'أدوية', ParcelStatus.READY_FOR_DISPATCH, true),
  extraParcel(28, 11, 'تفاح السويداء', 'أغذية', ParcelStatus.PROCESSING, false),
  extraParcel(29, 12, 'زيت زيتون إدلب', 'أغذية', ParcelStatus.PROCESSING, false),
  extraParcel(30, 13, 'قمح الحسكة', 'مواد خام', ParcelStatus.IN_TRANSIT, false),
  extraParcel(31, 14, 'أسماك طرطوس', 'أغذية', ParcelStatus.IN_TRANSIT, true),
  extraParcel(32, 15, 'كتب عبر القدومس', 'قرطاسية', ParcelStatus.READY_FOR_DISPATCH, false),
  extraParcel(33, 16, 'تمر إلى حمص', 'أغذية', ParcelStatus.PROCESSING, false),
  extraParcel(34, 17, 'قطع غيار طروادة', 'قطع غيار', ParcelStatus.IN_TRANSIT, false),
  extraParcel(35, 0, 'طرد إضافي لرحلة حمص', 'منزلية', ParcelStatus.IN_TRANSIT, false),
  extraParcel(36, 5, 'عينات أقمشة ثانية', 'أقمشة', ParcelStatus.IN_TRANSIT, false),
  extraParcel(37, 1, 'بذور زراعية', 'زراعة', ParcelStatus.PROCESSING, false),
  extraParcel(38, 2, 'سكر وطحين', 'أغذية', ParcelStatus.IN_TRANSIT, false),
  extraParcel(39, 6, 'زيتون ساحلي', 'أغذية', ParcelStatus.READY_FOR_DISPATCH, false),
  extraParcel(40, 8, 'صابون غار', 'منزلية', ParcelStatus.IN_TRANSIT, false),
  extraParcel(41, 14, 'حمضيات طرطوس', 'أغذية', ParcelStatus.IN_TRANSIT, false),
  extraParcel(42, 4, 'محركات صغيرة', 'صناعة', ParcelStatus.PROCESSING, true),
  extraParcel(43, 11, 'عنب السويداء', 'أغذية', ParcelStatus.PROCESSING, false),
] as const;

function extraParcel(
  seq: number,
  extraShipmentIndex: number,
  description: string,
  category: string,
  status: ParcelStatus,
  fragile: boolean,
) {
  return {
    id: `00000000-0000-7000-8000-0000000011${String(seq).padStart(2, '0')}`,
    shipmentId: `00000000-0000-7000-8000-000000000${880 + extraShipmentIndex}`,
    trackingNumber: `MSRT-2026-${String(seq).padStart(4, '0')}`,
    description,
    category,
    weight: 3.5,
    length: 35,
    width: 25,
    height: 18,
    status,
    fragile,
  };
}

@Injectable()
export class ParcelSeeder implements Seeder {
  private readonly logger = new Logger(ParcelSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting ParcelSeeder...');

    for (const p of [...PARCELS, ...EXTRA_PARCELS]) {
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
