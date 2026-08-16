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
import { ORG_UNIT_NAME } from '../rbac/organization-unit.seeder';
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
    originName: 'مركز مسارات — الزبلطاني',
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
    originName: 'مستودع عدرا',
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
    destName: 'مركز مسارات — الزبلطاني',
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
    originLocationId: LOCATION.TARTOUS_CORNICHE,
    destLocationId: LOCATION.INSHAAT,
    originName: 'مركز القدومس — طرطوس',
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
    originName: 'مركز طروادة — دير الزور',
    destName: 'فرع دمشق — الزبلطاني',
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
  {
    requestId: '00000000-0000-7000-8000-000000000830',
    quoteId: '00000000-0000-7000-8000-000000000860',
    shipmentId: '00000000-0000-7000-8000-000000000870',
    tenantIndex: 0,
    customerEmail: 'john.doe@email.com',
    originLocationId: LOCATION.ABU_RUMMANEH,
    destLocationId: LOCATION.MASHROU_10,
    originName: 'مركز مسارات — الزبلطاني',
    destName: 'فرع اللاذقية — المشروع العاشر',
    senderName: 'أحمد خالد الحسن',
    senderPhone: '+963933111004',
    senderNationalId: '01020304081',
    receiverName: 'ماهر عبد النور',
    receiverPhone: '+963933701122',
    pieces: 1,
    weight: 4.4,
    requestStatus: RequestStatus.CONVERTED,
    shipmentStatus: ShipmentStatus.READY_FOR_DISPATCH,
    quoteStatus: QuotationStatus.APPROVED,
    serviceLevel: ServiceLevel.STANDARD,
    basePrice: 40000,
    weightCharge: 0,
    notes: 'أجهزة كهربائية صغيرة إلى اللاذقية',
  },
  {
    requestId: '00000000-0000-7000-8000-000000000831',
    quoteId: '00000000-0000-7000-8000-000000000861',
    shipmentId: '00000000-0000-7000-8000-000000000871',
    tenantIndex: 0,
    customerEmail: 'bassam.qabbani@email.sy',
    originLocationId: LOCATION.ABU_RUMMANEH,
    destLocationId: LOCATION.AZIZIEH,
    originName: 'مركز مسارات — الزبلطاني',
    destName: 'فرع حلب — العزيزية',
    senderName: 'بسام عدنان القباني',
    senderPhone: '+963933777001',
    senderNationalId: '01020304085',
    receiverName: 'طارق الأتاسي',
    receiverPhone: '+963955999003',
    pieces: 2,
    weight: 7.1,
    requestStatus: RequestStatus.CONVERTED,
    shipmentStatus: ShipmentStatus.IN_TRANSIT,
    quoteStatus: QuotationStatus.APPROVED,
    serviceLevel: ServiceLevel.EXPRESS,
    basePrice: 55000,
    weightCharge: 5000,
    notes: 'عينات أدوية ومستلزمات صيدلية إلى حلب',
  },
  {
    requestId: '00000000-0000-7000-8000-000000000832',
    quoteId: '00000000-0000-7000-8000-000000000862',
    shipmentId: '00000000-0000-7000-8000-000000000872',
    tenantIndex: 0,
    customerEmail: 'ghadah.hamdan@email.sy',
    originLocationId: LOCATION.INSHAAT,
    destLocationId: LOCATION.ABU_RUMMANEH,
    originName: 'فرع اللاذقية — المشروع العاشر',
    destName: 'مركز مسارات — الزبلطاني',
    senderName: 'غادة سليم حمدان',
    senderPhone: '+963944888002',
    senderNationalId: '01020304086',
    receiverName: 'سلمى كيلاني',
    receiverPhone: '+963944221133',
    pieces: 1,
    weight: 2.8,
    requestStatus: RequestStatus.CONVERTED,
    shipmentStatus: ShipmentStatus.READY_FOR_COLLECTION,
    quoteStatus: QuotationStatus.APPROVED,
    serviceLevel: ServiceLevel.STANDARD,
    basePrice: 40000,
    weightCharge: 0,
    notes: 'ملابس جاهزة من الساحل — جاهزة للاستلام بدمشق',
  },
  {
    requestId: '00000000-0000-7000-8000-000000000833',
    quoteId: '00000000-0000-7000-8000-000000000863',
    shipmentId: '00000000-0000-7000-8000-000000000873',
    tenantIndex: 0,
    customerEmail: 'tareq.atasi@email.sy',
    originLocationId: LOCATION.AZIZIEH,
    destLocationId: LOCATION.MEZZEH,
    originName: 'فرع حلب — العزيزية',
    destName: 'مستودع عدرا',
    senderName: 'طارق الأتاسي',
    senderPhone: '+963955999003',
    senderNationalId: '01020304087',
    receiverName: 'لينا بركات',
    receiverPhone: '+963933445566',
    pieces: 3,
    weight: 9.5,
    requestStatus: RequestStatus.CONVERTED,
    shipmentStatus: ShipmentStatus.DELIVERED,
    quoteStatus: QuotationStatus.APPROVED,
    serviceLevel: ServiceLevel.STANDARD,
    basePrice: 35000,
    weightCharge: 10000,
    notes: 'أقمشة وحرائر حلبية سُلّمت في المزة',
  },
  {
    requestId: '00000000-0000-7000-8000-000000000834',
    quoteId: '00000000-0000-7000-8000-000000000864',
    shipmentId: '00000000-0000-7000-8000-000000000874',
    tenantIndex: 0,
    customerEmail: 'john.doe@email.com',
    originLocationId: LOCATION.MEZZEH,
    destLocationId: LOCATION.INSHAAT,
    originName: 'مستودع عدرا',
    destName: 'فرع اللاذقية — المشروع العاشر',
    senderName: 'أحمد خالد الحسن',
    senderPhone: '+963933111004',
    senderNationalId: '01020304081',
    receiverName: 'حسام الأخرس',
    receiverPhone: '+963941223344',
    pieces: 2,
    weight: 6.0,
    requestStatus: RequestStatus.CONVERTED,
    shipmentStatus: ShipmentStatus.PROCESSING,
    quoteStatus: QuotationStatus.APPROVED,
    serviceLevel: ServiceLevel.STANDARD,
    basePrice: 40000,
    weightCharge: 2500,
    notes: 'كتب ومستلزمات مكتبية إلى اللاذقية',
  },
  {
    requestId: '00000000-0000-7000-8000-000000000835',
    quoteId: '00000000-0000-7000-8000-000000000865',
    shipmentId: '00000000-0000-7000-8000-000000000875',
    tenantIndex: 0,
    customerEmail: 'jane.smith@email.com',
    originLocationId: LOCATION.MEZZEH,
    destLocationId: LOCATION.AZIZIEH,
    originName: 'مركز مسارات — الزبلطاني',
    destName: 'فرع حلب — العزيزية',
    senderName: 'ليلى حسن المصري',
    senderPhone: '+963944222004',
    senderNationalId: '01020304082',
    receiverName: 'منى العجيلي',
    receiverPhone: '+963955667788',
    pieces: 1,
    weight: 1.8,
    requestStatus: RequestStatus.CONVERTED,
    shipmentStatus: ShipmentStatus.CANCELLED,
    quoteStatus: QuotationStatus.APPROVED,
    serviceLevel: ServiceLevel.EXPRESS,
    basePrice: 55000,
    weightCharge: 0,
    notes: 'طلب أُلغي قبل التحميل بناءً على طلب المرسل',
  },
  {
    requestId: '00000000-0000-7000-8000-000000000836',
    quoteId: '00000000-0000-7000-8000-000000000866',
    shipmentId: '00000000-0000-7000-8000-000000000876',
    tenantIndex: 1,
    customerEmail: 'ghadah.hamdan@email.sy',
    originLocationId: LOCATION.TARTOUS_CORNICHE,
    destLocationId: LOCATION.INSHAAT,
    originName: 'مركز القدومس — طرطوس',
    destName: 'فرع حمص — الإنشاءات',
    senderName: 'غادة سليم حمدان',
    senderPhone: '+963944888002',
    senderNationalId: '01020304086',
    receiverName: 'نبيل قضماني',
    receiverPhone: '+963931112233',
    pieces: 2,
    weight: 5.2,
    requestStatus: RequestStatus.CONVERTED,
    shipmentStatus: ShipmentStatus.IN_TRANSIT,
    quoteStatus: QuotationStatus.APPROVED,
    serviceLevel: ServiceLevel.STANDARD,
    basePrice: 36000,
    weightCharge: 0,
    notes: 'مواد غذائية معلبة من دمشق إلى حمص',
  },
];

const EXTRA_SHIPMENTS: ShipmentSeed[] = [
  extraShipment(0, 0, 'john.doe@email.com', LOCATION.ABU_RUMMANEH, LOCATION.INSHAAT, ORG_UNIT_NAME.MASARAT_HUB, ORG_UNIT_NAME.MASARAT_HOMS, 'أحمد خالد الحسن', '+963933111004', '01020304081', 'فادي طنوس', '+963933555010', RequestStatus.CONVERTED, ShipmentStatus.IN_TRANSIT, ServiceLevel.STANDARD, 28000, 'كرتون أدوات منزلية إلى حمص'),
  extraShipment(1, 0, 'bassam.qabbani@email.sy', LOCATION.JARAMANA, LOCATION.DARAA_SABEEL, ORG_UNIT_NAME.MASARAT_JARAMANA, ORG_UNIT_NAME.MASARAT_DARAA, 'بسام عدنان القباني', '+963933777001', '01020304085', 'مايا قاسم', '+963933120006', RequestStatus.CONVERTED, ShipmentStatus.PROCESSING, ServiceLevel.EXPRESS, 34100, 'مستلزمات زراعية إلى درعا'),
  extraShipment(2, 0, 'ghadah.hamdan@email.sy', LOCATION.ZABLATANI, LOCATION.QUSOUR, ORG_UNIT_NAME.MASARAT_HUB, ORG_UNIT_NAME.MASARAT_DEIR, 'غادة سليم حمدان', '+963944888002', '01020304086', 'وليد الحريري', '+963933120007', RequestStatus.CONVERTED, ShipmentStatus.IN_TRANSIT, ServiceLevel.STANDARD, 55000, 'أغذية إلى دير الزور'),
  extraShipment(3, 0, 'jane.smith@email.com', LOCATION.JARAMANA, LOCATION.AZIZIEH, ORG_UNIT_NAME.MASARAT_JARAMANA, ORG_UNIT_NAME.MASARAT_ALEPPO, 'ليلى حسن المصري', '+963944222004', '01020304082', 'عمر نجار', '+963955333004', RequestStatus.CONVERTED, ShipmentStatus.READY_FOR_DISPATCH, ServiceLevel.EXPRESS, 54250, 'ملابس من جرمانا إلى حلب'),
  extraShipment(4, 0, 'john.doe@email.com', LOCATION.ADRA_INDUSTRIAL, LOCATION.TARTOUS_CORNICHE, ORG_UNIT_NAME.MASARAT_WAREHOUSE, ORG_UNIT_NAME.MASARAT_TARTOUS, 'أحمد خالد الحسن', '+963933111004', '01020304081', 'ماهر عبد النور', '+963933701122', RequestStatus.CONVERTED, ShipmentStatus.PROCESSING, ServiceLevel.STANDARD, 40000, 'قطع صناعية من عدرا إلى طرطوس'),
  extraShipment(5, 0, 'tareq.atasi@email.sy', LOCATION.INSHAAT, LOCATION.AZIZIEH, ORG_UNIT_NAME.MASARAT_HOMS, ORG_UNIT_NAME.MASARAT_ALEPPO, 'طارق الأتاسي', '+963955999003', '01020304087', 'منى العجيلي', '+963955667788', RequestStatus.CONVERTED, ShipmentStatus.IN_TRANSIT, ServiceLevel.STANDARD, 30000, 'أقمشة من حمص إلى حلب — المرحلة الثانية'),
  extraShipment(6, 0, 'hiba.atri@email.sy', LOCATION.MASHROU_10, LOCATION.ABU_RUMMANEH, ORG_UNIT_NAME.MASARAT_LATAKIA, ORG_UNIT_NAME.MASARAT_HUB, 'هبة محمد عطري', '+963966444004', '01020304084', 'أحمد خالد الحسن', '+963933111004', RequestStatus.CONVERTED, ShipmentStatus.READY_FOR_DISPATCH, ServiceLevel.STANDARD, 40000, 'سمك معلب من اللاذقية'),
  extraShipment(7, 0, 'omar.najjar@email.sy', LOCATION.DARAA_SABEEL, LOCATION.DAMASCUS, ORG_UNIT_NAME.MASARAT_DARAA, ORG_UNIT_NAME.MASARAT_HUB, 'عمر عبد الله نجار', '+963955333004', '01020304083', 'سلمى كيلاني', '+963933120008', RequestStatus.CONVERTED, ShipmentStatus.PROCESSING, ServiceLevel.STANDARD, 22000, 'خضار من درعا إلى دمشق'),
  extraShipment(8, 0, 'john.doe@email.com', LOCATION.QUSOUR, LOCATION.SHAALAN, ORG_UNIT_NAME.MASARAT_DEIR, ORG_UNIT_NAME.MASARAT_HUB, 'أحمد خالد الحسن', '+963933111004', '01020304081', 'رامي قصّار', '+963933120001', RequestStatus.CONVERTED, ShipmentStatus.IN_TRANSIT, ServiceLevel.EXPRESS, 85250, 'تمور ديرية إلى دمشق'),
  extraShipment(9, 0, 'bassam.qabbani@email.sy', LOCATION.RAQQA, LOCATION.MEZZEH, ORG_UNIT_NAME.MASARAT_RAQQA, ORG_UNIT_NAME.MASARAT_WAREHOUSE, 'بسام عدنان القباني', '+963933777001', '01020304085', 'دينا الحلبي', '+963933120002', RequestStatus.CONVERTED, ShipmentStatus.PROCESSING, ServiceLevel.STANDARD, 55000, 'قطن من الرقة إلى عدرا'),
  extraShipment(10, 0, 'ghadah.hamdan@email.sy', LOCATION.HAMA, LOCATION.LATAKIA, ORG_UNIT_NAME.MASARAT_HAMA, ORG_UNIT_NAME.MASARAT_LATAKIA, 'غادة سليم حمدان', '+963944888002', '01020304086', 'لينا بركات', '+963933120004', RequestStatus.CONVERTED, ShipmentStatus.READY_FOR_DISPATCH, ServiceLevel.SAME_DAY, 53750, 'أدوية عاجلة من حماة إلى اللاذقية'),
  extraShipment(11, 0, 'jane.smith@email.com', LOCATION.SWEIDA, LOCATION.JARAMANA, ORG_UNIT_NAME.MASARAT_SWEIDA, ORG_UNIT_NAME.MASARAT_JARAMANA, 'ليلى حسن المصري', '+963944222004', '01020304082', 'فادي صباغ', '+963933120003', RequestStatus.CONVERTED, ShipmentStatus.PROCESSING, ServiceLevel.STANDARD, 22000, 'تفاح السويداء إلى جرمانا'),
  extraShipment(12, 0, 'john.doe@email.com', LOCATION.IDLIB, LOCATION.ABU_RUMMANEH, ORG_UNIT_NAME.MASARAT_IDLIB, ORG_UNIT_NAME.MASARAT_HUB, 'أحمد خالد الحسن', '+963933111004', '01020304081', 'مهند رسلان', '+963944111001', RequestStatus.CONVERTED, ShipmentStatus.PROCESSING, ServiceLevel.STANDARD, 35000, 'زيت زيتون من إدلب'),
  extraShipment(13, 0, 'tareq.atasi@email.sy', LOCATION.HASAKAH, LOCATION.AZIZIEH, ORG_UNIT_NAME.MASARAT_HASAKAH, ORG_UNIT_NAME.MASARAT_ALEPPO, 'طارق الأتاسي', '+963955999003', '01020304087', 'لينا خوري', '+963933111003', RequestStatus.CONVERTED, ShipmentStatus.IN_TRANSIT, ServiceLevel.STANDARD, 48000, 'قمح من الحسكة إلى حلب'),
  extraShipment(14, 1, 'hiba.atri@email.sy', LOCATION.TARTOUS_CORNICHE, LOCATION.ABU_RUMMANEH, ORG_UNIT_NAME.QADMOUS_HUB, ORG_UNIT_NAME.QADMOUS_DAMASCUS, 'هبة محمد عطري', '+963966444004', '01020304084', 'أحمد خالد الحسن', '+963933111004', RequestStatus.CONVERTED, ShipmentStatus.IN_TRANSIT, ServiceLevel.EXPRESS, 62000, 'أسماك طرطوس إلى دمشق'),
  extraShipment(15, 1, 'john.doe@email.com', LOCATION.ABU_RUMMANEH, LOCATION.AZIZIEH, ORG_UNIT_NAME.QADMOUS_DAMASCUS, ORG_UNIT_NAME.QADMOUS_ALEPPO, 'أحمد خالد الحسن', '+963933111004', '01020304081', 'عمر نجار', '+963955333004', RequestStatus.CONVERTED, ShipmentStatus.READY_FOR_DISPATCH, ServiceLevel.STANDARD, 35000, 'كتب من دمشق إلى حلب عبر القدومس'),
  extraShipment(16, 2, 'hiba.atri@email.sy', LOCATION.QUSOUR, LOCATION.INSHAAT, ORG_UNIT_NAME.TROJAN_HUB, ORG_UNIT_NAME.TROJAN_HOMS, 'هبة محمد عطري', '+963966444004', '01020304084', 'نبيل قضماني', '+963931112233', RequestStatus.CONVERTED, ShipmentStatus.PROCESSING, ServiceLevel.STANDARD, 50000, 'تمر ديري إلى حمص'),
  extraShipment(17, 2, 'omar.najjar@email.sy', LOCATION.ZABLATANI, LOCATION.AZIZIEH, ORG_UNIT_NAME.TROJAN_DAMASCUS, ORG_UNIT_NAME.TROJAN_ALEPPO, 'عمر عبد الله نجار', '+963955333004', '01020304083', 'منى العجيلي', '+963955667788', RequestStatus.CONVERTED, ShipmentStatus.IN_TRANSIT, ServiceLevel.EXPRESS, 54250, 'قطع غيار عبر طروادة إلى حلب'),
];

function extraShipment(
  index: number,
  tenantIndex: number,
  customerEmail: string,
  originLocationId: string,
  destLocationId: string,
  originName: string,
  destName: string,
  senderName: string,
  senderPhone: string,
  senderNationalId: string,
  receiverName: string,
  receiverPhone: string,
  requestStatus: RequestStatus,
  shipmentStatus: ShipmentStatus,
  serviceLevel: ServiceLevel,
  basePrice: number,
  notes: string,
): ShipmentSeed {
  return {
    requestId: `00000000-0000-7000-8000-000000000${837 + index}`,
    quoteId: `00000000-0000-7000-8000-000000000${877 + index}`,
    shipmentId: `00000000-0000-7000-8000-000000000${880 + index}`,
    tenantIndex,
    customerEmail,
    originLocationId,
    destLocationId,
    originName,
    destName,
    senderName,
    senderPhone,
    senderNationalId,
    receiverName,
    receiverPhone,
    pieces: 1,
    weight: 4.5,
    requestStatus,
    shipmentStatus,
    quoteStatus: QuotationStatus.APPROVED,
    serviceLevel,
    basePrice,
    weightCharge: 0,
    notes,
  };
}

@Injectable()
export class ShipmentRequestSeeder implements Seeder {
  private readonly logger = new Logger(ShipmentRequestSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting ShipmentRequestSeeder...');

    for (const item of [...SHIPMENTS, ...EXTRA_SHIPMENTS]) {
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

    await this.seedMarketplaceQuotes();

    await this.prisma.customer_shipment.updateMany({
      where: {
        OR: [
          { sender_name: { in: ['John Doe', 'John Sender'] } },
          { receiver_name: { in: ['Jane Smith', 'Jane Receiver'] } },
        ],
      },
      data: {
        sender_name: 'أحمد خالد الحسن',
        sender_phone: '+963933111004',
        receiver_name: 'ليلى حسن المصري',
        receiver_phone: '+963944222004',
      },
    });

    this.logger.log('ShipmentRequestSeeder completed.');
  }

  private async seedMarketplaceQuotes(): Promise<void> {
    const customerUser = await this.prisma.users.findUnique({
      where: { email: 'john.doe@email.com' },
    });
    const customer = customerUser
      ? await this.prisma.customer_profile.findUnique({
          where: { user_id: customerUser.id },
        })
      : null;
    if (!customer) {
      return;
    }

    const request = await this.prisma.shipment_request.upsert({
      where: { id: '00000000-0000-7000-8000-000000000856' },
      update: { status: RequestStatus.PENDING },
      create: {
        id: '00000000-0000-7000-8000-000000000856',
        customer_profile_id: customer.id,
        target_tenant_id: null,
        origin_global_location_id: LOCATION.JARAMANA,
        destination_global_location_id: LOCATION.AZIZIEH,
        sender_name: 'أحمد خالد الحسن',
        sender_phone: '+963933111004',
        receiver_name: 'عمر عبد الله نجار',
        receiver_phone: '+963955333004',
        expected_pieces_count: 2,
        expected_total_weight_kg: 6,
        notes: 'طلب مقارنة أسعار من جرمانا إلى حلب — عروض كل الشركات',
        status: RequestStatus.PENDING,
      },
    });

    const routes = [
      {
        tenantIndex: 0,
        originName: ORG_UNIT_NAME.MASARAT_JARAMANA,
        destName: ORG_UNIT_NAME.MASARAT_ALEPPO,
        prices: [
          { level: ServiceLevel.STANDARD, amount: 35000 },
          { level: ServiceLevel.EXPRESS, amount: 54250 },
          { level: ServiceLevel.SAME_DAY, amount: 75250 },
        ],
      },
      {
        tenantIndex: 1,
        originName: ORG_UNIT_NAME.QADMOUS_JARAMANA,
        destName: ORG_UNIT_NAME.QADMOUS_ALEPPO,
        prices: [
          { level: ServiceLevel.STANDARD, amount: 35000 },
          { level: ServiceLevel.EXPRESS, amount: 54250 },
          { level: ServiceLevel.SAME_DAY, amount: 75250 },
        ],
      },
      {
        tenantIndex: 2,
        originName: ORG_UNIT_NAME.TROJAN_DAMASCUS,
        destName: ORG_UNIT_NAME.TROJAN_ALEPPO,
        prices: [
          { level: ServiceLevel.STANDARD, amount: 35000 },
          { level: ServiceLevel.EXPRESS, amount: 54250 },
          { level: ServiceLevel.SAME_DAY, amount: 75250 },
        ],
      },
    ];

    let quoteIndex = 0;
    for (const route of routes) {
      const tenant = SEEDED_TENANTS[route.tenantIndex];
      const origin = await this.prisma.organization_unit.findFirst({
        where: { tenant_id: tenant.id, name: route.originName },
      });
      const destination = await this.prisma.organization_unit.findFirst({
        where: { tenant_id: tenant.id, name: route.destName },
      });
      const employee = await this.prisma.employee.findFirst({
        where: { tenant_id: tenant.id },
        orderBy: { employee_code: 'asc' },
      });
      if (!origin || !destination || !employee) {
        continue;
      }

      for (const price of route.prices) {
        const quoteId = `00000000-0000-7000-8000-000000000${910 + quoteIndex}`;
        quoteIndex += 1;
        await this.prisma.quotation.upsert({
          where: { id: quoteId },
          update: {
            status: QuotationStatus.PENDING,
            amount: price.amount,
            service_level: price.level,
          },
          create: {
            id: quoteId,
            tenant_id: tenant.id,
            shipment_request_id: request.id,
            origin_org_unit_id: origin.id,
            destination_org_unit_id: destination.id,
            quotation_type: QuotationType.AUTOMATIC,
            base_price: price.amount,
            weight_charge: 2500,
            extra_fees: 0,
            amount: price.amount + 2500,
            status: QuotationStatus.PENDING,
            service_level: price.level,
            submitted_by_employee_id: employee.id,
            notes: `عرض ${tenant.name} — ${price.level}`,
          },
        });
      }
    }
  }
}
