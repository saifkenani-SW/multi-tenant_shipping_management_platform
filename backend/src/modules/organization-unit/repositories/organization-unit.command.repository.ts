import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { TransactionalPrismaService } from '../../../core/transaction';
import {
  CreateOrganizationUnitRepositoryData,
  UpdateOrganizationUnitRepositoryData,
} from '../contracts/persistence/organization-unit-repository-data.types';
import { IOrganizationUnitCommandRepository } from '../interfaces/organization-unit.command.repository.interface';

/**
 * عمودان لا يفهمهما Prisma (Unsupported) ويمران عبر SQL خام:
 *
 * - `location`  geometry(Point, 4326)
 * - `tree_path` ltree
 *
 * تسمية ltree تقبل [A-Za-z0-9_] فقط، والـ UUID يحتوي شرطات، لذلك
 * تُستبدل الشرطة بشرطة سفلية قبل بناء المسار.
 */
@Injectable()
export class OrganizationUnitCommandRepository implements IOrganizationUnitCommandRepository {
  constructor(private readonly prisma: TransactionalPrismaService) {}

  async create(
    data: CreateOrganizationUnitRepositoryData,
  ): Promise<string> {
    // المسار يُبنى داخل نفس الجملة: مسار الأب متبوعاً بتسمية الصف
    // الجديد، أو التسمية وحدها للجذور.
    const rows = await this.prisma.client.$queryRaw<{ id: string }[]>(
      Prisma.sql`
        WITH new_unit AS (
          SELECT gen_random_uuid() AS id
        )
        INSERT INTO organization_unit (
          id, tenant_id, parent_id, zone_id, name, org_type,
          address_line, location, tree_path
        )
        SELECT
          new_unit.id,
          ${data.tenantId}::uuid,
          ${data.parentId}::uuid,
          ${data.zoneId}::uuid,
          ${data.name},
          ${data.orgType}::"OrgType",
          ${data.addressLine},
          ${this.pointExpression(data.longitude, data.latitude)},
          CASE
            WHEN ${data.parentId}::uuid IS NULL
              THEN text2ltree(replace(new_unit.id::text, '-', '_'))
            ELSE (
              SELECT parent.tree_path
                     || text2ltree(replace(new_unit.id::text, '-', '_'))
              FROM organization_unit parent
              WHERE parent.id = ${data.parentId}::uuid
            )
          END
        FROM new_unit
        RETURNING id
      `,
    );

    return rows[0].id;
  }

  /**
   * لا يلمس tree_path: الأب غير قابل للتعديل، فالمسار ثابت طوال حياة
   * الصف. نقل وحدة يحتاج عملية مستقلة تعيد حساب مسارات كل الأحفاد.
   */
  async update(
    id: string,
    data: UpdateOrganizationUnitRepositoryData,
  ): Promise<void> {
    const assignments: Prisma.Sql[] = [];

    if (data.name !== undefined) {
      assignments.push(Prisma.sql`name = ${data.name}`);
    }

    if (data.addressLine !== undefined) {
      assignments.push(Prisma.sql`address_line = ${data.addressLine}`);
    }

    if (data.zoneId !== undefined) {
      assignments.push(Prisma.sql`zone_id = ${data.zoneId}::uuid`);
    }

    if (data.isActive !== undefined) {
      assignments.push(Prisma.sql`is_active = ${data.isActive}`);
    }

    if (data.longitude !== undefined || data.latitude !== undefined) {
      assignments.push(
        Prisma.sql`location = ${this.pointExpression(
          data.longitude ?? null,
          data.latitude ?? null,
        )}`,
      );
    }

    if (assignments.length === 0) {
      return;
    }

    // updated_at يحمل @updatedAt في Prisma، لكن SQL الخام يتجاوز ذلك.
    assignments.push(Prisma.sql`updated_at = NOW()`);

    await this.prisma.client.$executeRaw(
      Prisma.sql`
        UPDATE organization_unit
        SET ${Prisma.join(assignments, ', ')}
        WHERE id = ${id}::uuid
      `,
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.client.organization_unit.delete({ where: { id } });
  }

  /**
   * استبدال كامل. يجب أن يجري داخل @Transactional() وإلا تركنا الوحدة
   * بلا تغطية إذا فشل الإدراج.
   */
  async setCoverage(
    id: string,
    tenantId: string,
    locationIds: readonly string[],
  ): Promise<void> {
    await this.prisma.client.org_unit_location_mapping.deleteMany({
      where: { organization_unit_id: id },
    });

    if (locationIds.length === 0) {
      return;
    }

    await this.prisma.client.org_unit_location_mapping.createMany({
      data: locationIds.map((locationId) => ({
        tenant_id: tenantId,
        organization_unit_id: id,
        global_location_id: locationId,
      })),
      skipDuplicates: true,
    });
  }

  private pointExpression(
    longitude: number | null,
    latitude: number | null,
  ): Prisma.Sql {
    if (longitude === null || latitude === null) {
      return Prisma.sql`NULL`;
    }

    return Prisma.sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
  }
}
