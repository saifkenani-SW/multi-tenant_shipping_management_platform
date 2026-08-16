import { Injectable, Logger } from '@nestjs/common';
import { OrgType } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { ZONE } from '../geography/zone.seeder';
import { LOCATION } from '../system/global-location.seeder';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';

export const ORG_UNIT_NAME = {
  MASARAT_HUB: 'مركز مسارات — الزبلطاني',
  MASARAT_WAREHOUSE: 'مستودع عدرا',
  MASARAT_JARAMANA: 'فرع جرمانا',
  MASARAT_ALEPPO: 'فرع حلب — العزيزية',
  MASARAT_ALEPPO_WH: 'مستودع حلب — الفرقان',
  MASARAT_IDLIB: 'فرع إدلب',
  MASARAT_LATAKIA: 'فرع اللاذقية — المشروع العاشر',
  MASARAT_TARTOUS: 'فرع طرطوس',
  MASARAT_HOMS: 'فرع حمص — الإنشاءات',
  MASARAT_HAMA: 'فرع حماة',
  MASARAT_DARAA: 'فرع درعا',
  MASARAT_SWEIDA: 'فرع السويداء',
  MASARAT_QUNEITRA: 'فرع القنيطرة',
  MASARAT_DEIR: 'فرع دير الزور',
  MASARAT_RAQQA: 'فرع الرقة',
  MASARAT_HASAKAH: 'فرع الحسكة',
  QADMOUS_HUB: 'مركز القدومس — طرطوس',
  QADMOUS_ALEPPO: 'فرع حلب',
  QADMOUS_HOMS: 'فرع حمص — الإنشاءات',
  QADMOUS_DAMASCUS: 'فرع دمشق — أبو رمانة',
  QADMOUS_LATAKIA: 'فرع اللاذقية',
  QADMOUS_WAREHOUSE: 'مستودع طرطوس',
  QADMOUS_HAMA: 'فرع حماة',
  QADMOUS_JARAMANA: 'فرع جرمانا',
  TROJAN_HUB: 'مركز طروادة — دير الزور',
  TROJAN_DAMASCUS: 'فرع دمشق — الزبلطاني',
  TROJAN_ALEPPO: 'فرع حلب',
  TROJAN_RAQQA: 'فرع الرقة',
  TROJAN_HOMS: 'فرع حمص',
  TROJAN_HASAKAH: 'فرع الحسكة',
  TROJAN_WAREHOUSE: 'مستودع دير الزور',
} as const;

type BranchSeed = {
  idSuffix: string;
  name: string;
  zoneSuffix: string;
  locIds: string[];
  type: OrgType;
  address: string;
  lat: number;
  lng: number;
  parentSuffix?: string;
};

@Injectable()
export class OrganizationUnitSeeder implements Seeder {
  private readonly logger = new Logger(OrganizationUnitSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting OrganizationUnitSeeder...');

    let mappingIndex = 0;

    for (let i = 0; i < SEEDED_TENANTS.length; i++) {
      const tenant = SEEDED_TENANTS[i];
      const units = this.branchesForTenant(tenant.id);
      const ordered = [
        ...units.filter((unit) => !unit.parentSuffix),
        ...units.filter((unit) => unit.parentSuffix),
      ];

      for (const unit of ordered) {
        const orgId = `00000000-0000-7000-8000-00000000${i}${unit.idSuffix}`;
        const zoneId = `00000000-0000-7000-8000-00000000${i}${unit.zoneSuffix}`;
        const parentId = unit.parentSuffix
          ? `00000000-0000-7000-8000-00000000${i}${unit.parentSuffix}`
          : null;

        const existing = await this.prisma.organization_unit.findUnique({
          where: { id: orgId },
        });

        if (!existing) {
          await this.prisma.$executeRaw`
            INSERT INTO organization_unit (id, tenant_id, parent_id, zone_id, name, org_type, address_line, is_active, updated_at, location)
            VALUES (
              ${orgId}::uuid,
              ${tenant.id}::uuid,
              ${parentId}::uuid,
              ${zoneId}::uuid,
              ${unit.name},
              ${unit.type}::"OrgType",
              ${unit.address},
              true,
              NOW(),
              ST_SetSRID(ST_MakePoint(${unit.lng}, ${unit.lat}), 4326)
            )
          `;
        } else {
          await this.prisma.$executeRaw`
            UPDATE organization_unit
            SET
              tenant_id = ${tenant.id}::uuid,
              parent_id = ${parentId}::uuid,
              zone_id = ${zoneId}::uuid,
              name = ${unit.name},
              org_type = ${unit.type}::"OrgType",
              address_line = ${unit.address},
              is_active = true,
              location = ST_SetSRID(ST_MakePoint(${unit.lng}, ${unit.lat}), 4326),
              updated_at = NOW()
            WHERE id = ${orgId}::uuid
          `;
        }

        for (const locId of unit.locIds) {
          const mapId = `00000000-0000-7000-8000-000000017${String(mappingIndex).padStart(3, '0')}`;
          mappingIndex += 1;

          await this.prisma.org_unit_location_mapping.upsert({
            where: { id: mapId },
            update: {
              tenant_id: tenant.id,
              organization_unit_id: orgId,
              global_location_id: locId,
              coverage_type: 'BOTH',
            },
            create: {
              id: mapId,
              tenant_id: tenant.id,
              organization_unit_id: orgId,
              global_location_id: locId,
              coverage_type: 'BOTH',
            },
          });
        }
      }
    }

    this.logger.log('OrganizationUnitSeeder completed.');
  }

  private branchesForTenant(tenantId: string): BranchSeed[] {
    if (tenantId === SEEDED_TENANTS[0].id) {
      return [
        {
          idSuffix: '501',
          name: ORG_UNIT_NAME.MASARAT_HUB,
          zoneSuffix: ZONE.DAMASCUS,
          locIds: [
            LOCATION.DAMASCUS_GOV,
            LOCATION.DAMASCUS,
            LOCATION.ABU_RUMMANEH,
            LOCATION.ZABLATANI,
            LOCATION.SHAALAN,
          ],
          type: OrgType.BRANCH,
          address: 'سوق الزبلطاني، جانب كراج البولمان، دمشق',
          lat: 33.5091,
          lng: 36.3184,
        },
        {
          idSuffix: '504',
          name: ORG_UNIT_NAME.MASARAT_WAREHOUSE,
          zoneSuffix: ZONE.DAMASCUS,
          parentSuffix: '501',
          locIds: [
            LOCATION.RIF_DIMASHQ_GOV,
            LOCATION.ADRA,
            LOCATION.ADRA_INDUSTRIAL,
            LOCATION.MEZZEH,
          ],
          type: OrgType.BRANCH,
          address: 'المدينة الصناعية بعدرا، مستودع رقم 14، ريف دمشق',
          lat: 33.6097,
          lng: 36.515,
        },
        {
          idSuffix: '510',
          name: ORG_UNIT_NAME.MASARAT_JARAMANA,
          zoneSuffix: ZONE.DAMASCUS,
          parentSuffix: '501',
          locIds: [LOCATION.JARAMANA, LOCATION.DAMASCUS],
          type: OrgType.BRANCH,
          address: 'أوتوستراد جرمانا، مقابل فرن الشام',
          lat: 33.4873,
          lng: 36.3453,
        },
        {
          idSuffix: '502',
          name: ORG_UNIT_NAME.MASARAT_ALEPPO,
          zoneSuffix: ZONE.NORTH,
          parentSuffix: '501',
          locIds: [LOCATION.ALEPPO_GOV, LOCATION.ALEPPO, LOCATION.AZIZIEH],
          type: OrgType.BRANCH,
          address: 'شارع العزيزية، بناء الشهابي، حلب',
          lat: 36.2065,
          lng: 37.1543,
        },
        {
          idSuffix: '511',
          name: ORG_UNIT_NAME.MASARAT_ALEPPO_WH,
          zoneSuffix: ZONE.NORTH,
          parentSuffix: '501',
          locIds: [LOCATION.ALEPPO, LOCATION.ALEPPO_FURQAN],
          type: OrgType.BRANCH,
          address: 'حي الفرقان، المنطقة الصناعية، حلب',
          lat: 36.2168,
          lng: 37.1189,
        },
        {
          idSuffix: '512',
          name: ORG_UNIT_NAME.MASARAT_IDLIB,
          zoneSuffix: ZONE.NORTH,
          parentSuffix: '501',
          locIds: [LOCATION.IDLIB_GOV, LOCATION.IDLIB, LOCATION.IDLIB_DAI],
          type: OrgType.BRANCH,
          address: 'شارع الجمهورية، إدلب',
          lat: 35.9306,
          lng: 36.6339,
        },
        {
          idSuffix: '503',
          name: ORG_UNIT_NAME.MASARAT_LATAKIA,
          zoneSuffix: ZONE.COAST,
          parentSuffix: '501',
          locIds: [
            LOCATION.LATAKIA_GOV,
            LOCATION.LATAKIA,
            LOCATION.MASHROU_10,
            LOCATION.LATAKIA_SHEIKH_DAHIR,
          ],
          type: OrgType.BRANCH,
          address: 'المشروع العاشر، بناء 14، اللاذقية',
          lat: 35.5194,
          lng: 35.7794,
        },
        {
          idSuffix: '513',
          name: ORG_UNIT_NAME.MASARAT_TARTOUS,
          zoneSuffix: ZONE.COAST,
          parentSuffix: '501',
          locIds: [
            LOCATION.TARTOUS_GOV,
            LOCATION.TARTOUS,
            LOCATION.TARTOUS_CORNICHE,
            LOCATION.TARTOUS_MINA,
          ],
          type: OrgType.BRANCH,
          address: 'الكورنيش البحري، طرطوس',
          lat: 34.8892,
          lng: 35.8861,
        },
        {
          idSuffix: '514',
          name: ORG_UNIT_NAME.MASARAT_HOMS,
          zoneSuffix: ZONE.CENTER,
          parentSuffix: '501',
          locIds: [
            LOCATION.HOMS_GOV,
            LOCATION.HOMS,
            LOCATION.INSHAAT,
            LOCATION.HOMS_WAER,
          ],
          type: OrgType.BRANCH,
          address: 'حي الإنشاءات، شارع الحضارة، حمص',
          lat: 34.7268,
          lng: 36.7076,
        },
        {
          idSuffix: '515',
          name: ORG_UNIT_NAME.MASARAT_HAMA,
          zoneSuffix: ZONE.CENTER,
          parentSuffix: '501',
          locIds: [LOCATION.HAMA_GOV, LOCATION.HAMA, LOCATION.HAMA_HAMIDIYE],
          type: OrgType.BRANCH,
          address: 'الحميدية، شارع العلمين، حماة',
          lat: 35.1372,
          lng: 36.7491,
        },
        {
          idSuffix: '516',
          name: ORG_UNIT_NAME.MASARAT_DARAA,
          zoneSuffix: ZONE.SOUTH,
          parentSuffix: '501',
          locIds: [LOCATION.DARAA_GOV, LOCATION.DARAA, LOCATION.DARAA_SABEEL],
          type: OrgType.BRANCH,
          address: 'حي السبيل، درعا',
          lat: 32.6254,
          lng: 36.1088,
        },
        {
          idSuffix: '517',
          name: ORG_UNIT_NAME.MASARAT_SWEIDA,
          zoneSuffix: ZONE.SOUTH,
          parentSuffix: '501',
          locIds: [LOCATION.SWEIDA_GOV, LOCATION.SWEIDA, LOCATION.SWEIDA_MAHATTA],
          type: OrgType.BRANCH,
          address: 'حي المحطة، السويداء',
          lat: 32.7122,
          lng: 36.5731,
        },
        {
          idSuffix: '518',
          name: ORG_UNIT_NAME.MASARAT_QUNEITRA,
          zoneSuffix: ZONE.SOUTH,
          parentSuffix: '501',
          locIds: [LOCATION.QUNEITRA_GOV, LOCATION.QUNEITRA, LOCATION.BAATH],
          type: OrgType.BRANCH,
          address: 'مدينة البعث، القنيطرة',
          lat: 33.1981,
          lng: 35.8964,
        },
        {
          idSuffix: '519',
          name: ORG_UNIT_NAME.MASARAT_DEIR,
          zoneSuffix: ZONE.EAST,
          parentSuffix: '501',
          locIds: [
            LOCATION.DEIR_EZ_ZOR_GOV,
            LOCATION.DEIR_EZ_ZOR,
            LOCATION.QUSOUR,
            LOCATION.DEIR_JOURA,
          ],
          type: OrgType.BRANCH,
          address: 'حي القصور، شارع النهر، دير الزور',
          lat: 35.3381,
          lng: 40.1402,
        },
        {
          idSuffix: '520',
          name: ORG_UNIT_NAME.MASARAT_RAQQA,
          zoneSuffix: ZONE.EAST,
          parentSuffix: '501',
          locIds: [LOCATION.RAQQA_GOV, LOCATION.RAQQA, LOCATION.RAQQA_THAWRA],
          type: OrgType.BRANCH,
          address: 'شارع الرشيد، الرقة',
          lat: 35.9503,
          lng: 39.0089,
        },
        {
          idSuffix: '521',
          name: ORG_UNIT_NAME.MASARAT_HASAKAH,
          zoneSuffix: ZONE.EAST,
          parentSuffix: '501',
          locIds: [
            LOCATION.HASAKAH_GOV,
            LOCATION.HASAKAH,
            LOCATION.HASAKAH_GWEIRAN,
          ],
          type: OrgType.BRANCH,
          address: 'حي غويران، الحسكة',
          lat: 36.5088,
          lng: 40.7392,
        },
      ];
    }

    if (tenantId === SEEDED_TENANTS[1].id) {
      return [
        {
          idSuffix: '505',
          name: ORG_UNIT_NAME.QADMOUS_HUB,
          zoneSuffix: ZONE.COAST,
          locIds: [
            LOCATION.TARTOUS_GOV,
            LOCATION.TARTOUS,
            LOCATION.TARTOUS_CORNICHE,
            LOCATION.TARTOUS_MINA,
          ],
          type: OrgType.BRANCH,
          address: 'الكورنيش البحري، مقابل الكراج القديم، طرطوس',
          lat: 34.8892,
          lng: 35.8861,
        },
        {
          idSuffix: '524',
          name: ORG_UNIT_NAME.QADMOUS_WAREHOUSE,
          zoneSuffix: ZONE.COAST,
          parentSuffix: '505',
          locIds: [LOCATION.TARTOUS, LOCATION.TARTOUS_MINA],
          type: OrgType.BRANCH,
          address: 'المنطقة الحرة، طرطوس',
          lat: 34.8924,
          lng: 35.8788,
        },
        {
          idSuffix: '523',
          name: ORG_UNIT_NAME.QADMOUS_LATAKIA,
          zoneSuffix: ZONE.COAST,
          parentSuffix: '505',
          locIds: [
            LOCATION.LATAKIA_GOV,
            LOCATION.LATAKIA,
            LOCATION.MASHROU_10,
            LOCATION.LATAKIA_SHEIKH_DAHIR,
          ],
          type: OrgType.BRANCH,
          address: 'الشيخ ضاهر، اللاذقية',
          lat: 35.5241,
          lng: 35.7833,
        },
        {
          idSuffix: '522',
          name: ORG_UNIT_NAME.QADMOUS_DAMASCUS,
          zoneSuffix: ZONE.DAMASCUS,
          parentSuffix: '505',
          locIds: [
            LOCATION.DAMASCUS_GOV,
            LOCATION.DAMASCUS,
            LOCATION.ABU_RUMMANEH,
            LOCATION.SHAALAN,
          ],
          type: OrgType.BRANCH,
          address: 'أبو رمانة، شارع المهدي بن بركة، دمشق',
          lat: 33.5194,
          lng: 36.2872,
        },
        {
          idSuffix: '526',
          name: ORG_UNIT_NAME.QADMOUS_JARAMANA,
          zoneSuffix: ZONE.DAMASCUS,
          parentSuffix: '505',
          locIds: [LOCATION.JARAMANA, LOCATION.DAMASCUS],
          type: OrgType.BRANCH,
          address: 'أوتوستراد جرمانا، بناء القدومس',
          lat: 33.4881,
          lng: 36.3462,
        },
        {
          idSuffix: '506',
          name: ORG_UNIT_NAME.QADMOUS_ALEPPO,
          zoneSuffix: ZONE.NORTH,
          parentSuffix: '505',
          locIds: [
            LOCATION.ALEPPO_GOV,
            LOCATION.ALEPPO,
            LOCATION.AZIZIEH,
            LOCATION.ALEPPO_FURQAN,
            LOCATION.IDLIB_GOV,
            LOCATION.IDLIB,
          ],
          type: OrgType.BRANCH,
          address: 'شارع الخندق، جانب جامع التوحيد، حلب',
          lat: 36.2041,
          lng: 37.1488,
        },
        {
          idSuffix: '509',
          name: ORG_UNIT_NAME.QADMOUS_HOMS,
          zoneSuffix: ZONE.CENTER,
          parentSuffix: '505',
          locIds: [LOCATION.HOMS_GOV, LOCATION.HOMS, LOCATION.INSHAAT],
          type: OrgType.BRANCH,
          address: 'حي الإنشاءات، شارع الحضارة، حمص',
          lat: 34.7268,
          lng: 36.7076,
        },
        {
          idSuffix: '525',
          name: ORG_UNIT_NAME.QADMOUS_HAMA,
          zoneSuffix: ZONE.CENTER,
          parentSuffix: '505',
          locIds: [LOCATION.HAMA_GOV, LOCATION.HAMA, LOCATION.HAMA_HAMIDIYE],
          type: OrgType.BRANCH,
          address: 'الحميدية، حماة',
          lat: 35.1372,
          lng: 36.7491,
        },
      ];
    }

    return [
      {
        idSuffix: '507',
        name: ORG_UNIT_NAME.TROJAN_HUB,
        zoneSuffix: ZONE.EAST,
        locIds: [
          LOCATION.DEIR_EZ_ZOR_GOV,
          LOCATION.DEIR_EZ_ZOR,
          LOCATION.QUSOUR,
          LOCATION.DEIR_JOURA,
        ],
        type: OrgType.BRANCH,
        address: 'حي القصور، شارع النهر، دير الزور',
        lat: 35.3381,
        lng: 40.1402,
      },
      {
        idSuffix: '531',
        name: ORG_UNIT_NAME.TROJAN_WAREHOUSE,
        zoneSuffix: ZONE.EAST,
        parentSuffix: '507',
        locIds: [LOCATION.DEIR_EZ_ZOR, LOCATION.QUSOUR],
        type: OrgType.BRANCH,
        address: 'المنطقة الصناعية، دير الزور',
        lat: 35.3294,
        lng: 40.1488,
      },
      {
        idSuffix: '508',
        name: ORG_UNIT_NAME.TROJAN_DAMASCUS,
        zoneSuffix: ZONE.DAMASCUS,
        parentSuffix: '507',
        locIds: [
          LOCATION.DAMASCUS_GOV,
          LOCATION.DAMASCUS,
          LOCATION.ABU_RUMMANEH,
          LOCATION.ZABLATANI,
          LOCATION.JARAMANA,
        ],
        type: OrgType.BRANCH,
        address: 'سوق الزبلطاني، بناء طروادة، دمشق',
        lat: 33.5098,
        lng: 36.3171,
      },
      {
        idSuffix: '527',
        name: ORG_UNIT_NAME.TROJAN_ALEPPO,
        zoneSuffix: ZONE.NORTH,
        parentSuffix: '507',
        locIds: [LOCATION.ALEPPO_GOV, LOCATION.ALEPPO, LOCATION.AZIZIEH],
        type: OrgType.BRANCH,
        address: 'العزيزية، حلب',
        lat: 36.2065,
        lng: 37.1543,
      },
      {
        idSuffix: '528',
        name: ORG_UNIT_NAME.TROJAN_RAQQA,
        zoneSuffix: ZONE.EAST,
        parentSuffix: '507',
        locIds: [LOCATION.RAQQA_GOV, LOCATION.RAQQA, LOCATION.RAQQA_THAWRA],
        type: OrgType.BRANCH,
        address: 'شارع الرشيد، الرقة',
        lat: 35.9503,
        lng: 39.0089,
      },
      {
        idSuffix: '530',
        name: ORG_UNIT_NAME.TROJAN_HASAKAH,
        zoneSuffix: ZONE.EAST,
        parentSuffix: '507',
        locIds: [LOCATION.HASAKAH_GOV, LOCATION.HASAKAH, LOCATION.HASAKAH_GWEIRAN],
        type: OrgType.BRANCH,
        address: 'غويران، الحسكة',
        lat: 36.5088,
        lng: 40.7392,
      },
      {
        idSuffix: '529',
        name: ORG_UNIT_NAME.TROJAN_HOMS,
        zoneSuffix: ZONE.CENTER,
        parentSuffix: '507',
        locIds: [LOCATION.HOMS_GOV, LOCATION.HOMS, LOCATION.INSHAAT, LOCATION.HAMA],
        type: OrgType.BRANCH,
        address: 'الإنشاءات، حمص',
        lat: 34.7268,
        lng: 36.7076,
      },
    ];
  }
}
