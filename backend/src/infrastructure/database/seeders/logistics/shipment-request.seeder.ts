import { Injectable, Logger } from '@nestjs/common';
import {
  QuotationStatus,
  QuotationType,
  RequestStatus,
  ServiceLevel,
  ShipmentStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { LOCATION } from '../system/global-location.seeder';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';

type ShipmentSeed = {
  requestId: string;
  quoteId: string;
  shipmentId: string;
  tenantIndex: number;
  customerEmail: string;
  originLocationId: string;
  destLocationId: string;
  originName: string;
  destName: string;
  senderName: string;
  senderPhone: string;
  senderNationalId: string;
  receiverName: string;
  receiverPhone: string;
  pieces: number;
  weight: number;
  requestStatus: RequestStatus;
  shipmentStatus: ShipmentStatus | null;
  quoteStatus: QuotationStatus;
  serviceLevel: ServiceLevel;
  basePrice: number;
  weightCharge: number;
  notes: string;
};

const SHIPMENTS: ShipmentSeed[] = [
  {
    requestId: '00000000-0000-7000-8000-000000000801',
    quoteId: '00000000-0000-7000-8000-000000000811',
    shipmentId: '00000000-0000-7000-8000-000000000821',
    tenantIndex: 0,
    customerEmail: 'john.doe@email.com',
    originLocationId: LOCATION.ABU_RUMMANEH,
    destLocationId: LOCATION.AZIZIEH,
    originName: 'مركز دمشق الرئيسي',
    destName: 'فرع حلب — العزيزية',
    senderName: 'أحمد خالد الحسن',
    senderPhone: '+963933111004',
    senderNationalId: '01020304081',
    receiverName: 'عمر عبد الله نجار',
    receiverPhone: '+963955333004',
    pieces: 2,
    weight: 5.5,
    requestStatus: RequestStatus.CONVERTED,
    shipmentStatus: ShipmentStatus.IN_TRANSIT,
    quoteStatus: QuotationStatus.APPROVED,
    serviceLevel: ServiceLevel.STANDARD,
    basePrice: 35000,
    weightCharge: 2500,
    notes: 'طرد ملابس ومستلزمات منزلية من دمشق إلى حلب',
  },
  {
    requestId: '00000000-0000-7000-8000-000000000804',
    quoteId: '00000000-0000-7000-8000-000000000814',
    shipmentId: '00000000-0000-7000-8000-000000000824',
    tenantIndex: 0,
    customerEmail: 'jane.smith@email.com',
    originLocationId: LOCATION.MEZZEH,
    destLocationId: LOCATION.MASHROU_10,
    originName: 'مستودع المزة',
    destName: 'فرع اللاذقية — المشروع العاشر',
    senderName: 'ليلى حسن المصري',
    senderPhone: '+963944222004',
    senderNationalId: '01020304082',
    receiverName: 'هبة محمد عطري',
    receiverPhone: '+963966444004',
    pieces: 1,
    weight: 3.2,
    requestStatus: RequestStatus.CONVERTED,
    shipmentStatus: ShipmentStatus.DELIVERED,
    quoteStatus: QuotationStatus.APPROVED,
    serviceLevel: ServiceLevel.EXPRESS,
    basePrice: 55000,
    weightCharge: 0,
    notes: 'طرد مستحضرات تجميل — تسليم سريع إلى اللاذقية',
  },
  {
    requestId: '00000000-0000-7000-8000-000000000805',
    quoteId: '00000000-0000-7000-8000-000000000815',
    shipmentId: '00000000-0000-7000-8000-000000000825',
    tenantIndex: 0,
    customerEmail: 'omar.najjar@email.sy',
    originLocationId: LOCATION.AZIZIEH,
    destLocationId: LOCATION.ABU_RUMMANEH,
    originName: 'فرع حلب — العزيزية',
    destName: 'مركز دمشق الرئيسي',
    senderName: 'عمر عبد الله نجار',
    senderPhone: '+963955333004',
    senderNationalId: '01020304083',
    receiverName: 'أحمد خالد الحسن',
    receiverPhone: '+963933111004',
    pieces: 3,
    weight: 8.0,
    requestStatus: RequestStatus.PENDING,
    shipmentStatus: null,
    quoteStatus: QuotationStatus.PENDING,
    serviceLevel: ServiceLevel.STANDARD,
    basePrice: 35000,
    weightCharge: 7500,
    notes: 'قطع غيار سيارات من حلب إلى دمشق — بانتظار موافقة العميل',
  },
  {
    requestId: '00000000-0000-7000-8000-000000000802',
    quoteId: '00000000-0000-7000-8000-000000000812',
    shipmentId: '00000000-0000-7000-8000-000000000822',
    tenantIndex: 1,
    customerEmail: 'john.doe@email.com',
    originLocationId: LOCATION.MEZZEH,
    destLocationId: LOCATION.INSHAAT,
    originName: 'مركز بردى — دمشق',
    destName: 'فرع حمص — الإنشاءات',
    senderName: 'أحمد خالد الحسن',
    senderPhone: '+963933111004',
    senderNationalId: '01020304081',
    receiverName: 'فادي جورج طنوس',
    receiverPhone: '+963933555010',
    pieces: 2,
    weight: 4.0,
    requestStatus: RequestStatus.CONVERTED,
    shipmentStatus: ShipmentStatus.PROCESSING,
    quoteStatus: QuotationStatus.APPROVED,
    serviceLevel: ServiceLevel.STANDARD,
    basePrice: 36000,
    weightCharge: 0,
    notes: 'مستندات تجارية وكتالوجات إلى حمص',
  },
  {
    requestId: '00000000-0000-7000-8000-000000000803',
    quoteId: '00000000-0000-7000-8000-000000000813',
    shipmentId: '00000000-0000-7000-8000-000000000823',
    tenantIndex: 2,
    customerEmail: 'hiba.atri@email.sy',
    originLocationId: LOCATION.QUSOUR,
    destLocationId: LOCATION.ABU_RUMMANEH,
    originName: 'مركز الفرات — دير الزور',
    destName: 'فرع دمشق',
    senderName: 'هبة محمد عطري',
    senderPhone: '+963966444004',
    senderNationalId: '01020304084',
    receiverName: 'ليلى حسن المصري',
    receiverPhone: '+963944222004',
    pieces: 1,
    weight: 6.8,
    requestStatus: RequestStatus.CONVERTED,
    shipmentStatus: ShipmentStatus.READY_FOR_COLLECTION,
    quoteStatus: QuotationStatus.APPROVED,
    serviceLevel: ServiceLevel.EXPRESS,
    basePrice: 60000,
    weightCharge: 4500,
    notes: 'طرد أغذية مجففة من دير الزور — جاهز للاستلام في دمشق',
  },
];

@Injectable()
export class ShipmentRequestSeeder implements Seeder {
  private readonly logger = new Logger(ShipmentRequestSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting ShipmentRequestSeeder...');

    for (const item of SHIPMENTS) {
      const tenant = SEEDED_TENANTS[item.tenantIndex];
      const customerUser = await this.prisma.users.findUnique({
        where: { email: item.customerEmail },
      });
      const customer = customerUser
        ? await this.prisma.customer_profile.findUnique({
            where: { user_id: customerUser.id },
          })
        : null;
      const origin = await this.prisma.organization_unit.findFirst({
        where: { tenant_id: tenant.id, name: item.originName },
      });
      const destination = await this.prisma.organization_unit.findFirst({
        where: { tenant_id: tenant.id, name: item.destName },
      });
      const employee = await this.prisma.employee.findFirst({
        where: { tenant_id: tenant.id },
        orderBy: { employee_code: 'asc' },
      });

      if (!customer || !origin || !destination || !employee) {
        this.logger.warn(
          `Skipping shipment seed ${item.requestId} for ${tenant.name}: missing relations`,
        );
        continue;
      }

      const request = await this.prisma.shipment_request.upsert({
        where: { id: item.requestId },
        update: {
          status: item.requestStatus,
          sender_name: item.senderName,
          sender_phone: item.senderPhone,
          receiver_name: item.receiverName,
          receiver_phone: item.receiverPhone,
          notes: item.notes,
        },
        create: {
          id: item.requestId,
          customer_profile_id: customer.id,
          target_tenant_id: tenant.id,
          origin_global_location_id: item.originLocationId,
          destination_global_location_id: item.destLocationId,
          sender_name: item.senderName,
          sender_phone: item.senderPhone,
          receiver_name: item.receiverName,
          receiver_phone: item.receiverPhone,
          expected_pieces_count: item.pieces,
          expected_total_weight_kg: item.weight,
          notes: item.notes,
          status: item.requestStatus,
          created_by_employee_id: employee.id,
        },
      });

      await this.prisma.quotation.upsert({
        where: { id: item.quoteId },
        update: {
          status: item.quoteStatus,
          amount: item.basePrice + item.weightCharge,
          service_level: item.serviceLevel,
        },
        create: {
          id: item.quoteId,
          tenant_id: tenant.id,
          shipment_request_id: request.id,
          origin_org_unit_id: origin.id,
          destination_org_unit_id: destination.id,
          quotation_type: QuotationType.AUTOMATIC,
          base_price: item.basePrice,
          weight_charge: item.weightCharge,
          extra_fees: 0,
          amount: item.basePrice + item.weightCharge,
          status: item.quoteStatus,
          service_level: item.serviceLevel,
          submitted_by_employee_id: employee.id,
          notes: item.notes,
        },
      });

      if (!item.shipmentStatus) {
        continue;
      }

      await this.prisma.customer_shipment.upsert({
        where: { id: item.shipmentId },
        update: {
          status: item.shipmentStatus,
          sender_name: item.senderName,
          sender_phone: item.senderPhone,
          receiver_name: item.receiverName,
          receiver_phone: item.receiverPhone,
          service_level: item.serviceLevel,
        },
        create: {
          id: item.shipmentId,
          tenant_id: tenant.id,
          shipment_request_id: request.id,
          origin_org_unit_id: origin.id,
          destination_org_unit_id: destination.id,
          sender_name: item.senderName,
          sender_phone: item.senderPhone,
          sender_national_id: item.senderNationalId,
          receiver_name: item.receiverName,
          receiver_phone: item.receiverPhone,
          total_chargeable_weight_kg: item.weight,
          status: item.shipmentStatus,
          service_level: item.serviceLevel,
          created_by_employee_id: employee.id,
          created_by_employee_name: employee.full_name,
        },
      });
    }

    this.logger.log('ShipmentRequestSeeder completed.');
  }
}
