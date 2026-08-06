import { Injectable } from '@nestjs/common';
import { TransactionalPrismaService } from '../../../../../packages/transaction/services/transactional-prisma.service';
import {
  CreateOrganizationUnitDto,
  OrgUnitLocationMappingDto,
} from '../../application/dtos/requests/create-organization-unit.dto';
import { UpdateOrganizationUnitDto } from '../../application/dtos/requests/update-organization-unit.dto';
import { CoverageType } from '@prisma/client';

@Injectable()
export class OrganizationUnitCommandRepository {
  constructor(private readonly prisma: TransactionalPrismaService) {}

  async create(
    tenantId: string,
    dto: CreateOrganizationUnitDto,
  ): Promise<{ id: string }> {
    const { location, coverageLocations, ...data } = dto;
    const orgTypeStr = data.orgType as any;

    // Create Organization Unit
    const created = await this.prisma.client.organization_unit.create({
      data: {
        tenant_id: tenantId,
        name: data.name,
        org_type: orgTypeStr,
        parent_id: data.parentId,
        zone_id: data.zoneId,
        address_line: data.addressLine,
        is_active: data.isActive ?? true,
      },
      select: { id: true },
    });

    // Update location using PostGIS
    if (location) {
      await this.prisma.client.$executeRawUnsafe(
        `UPDATE organization_unit SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
        location.longitude,
        location.latitude,
        created.id,
      );
    }

    // Add mappings
    if (coverageLocations && coverageLocations.length > 0) {
      const mappingData = coverageLocations.map((cov) => ({
        tenant_id: tenantId,
        organization_unit_id: created.id,
        global_location_id: cov.globalLocationId,
        coverage_type: cov.coverageType || CoverageType.DELIVERY_AREA,
      }));

      await this.prisma.client.org_unit_location_mapping.createMany({
        data: mappingData,
      });
    }

    return { id: created.id };
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateOrganizationUnitDto,
  ): Promise<{ id: string }> {
    const { location, coverageLocations, ...data } = dto;

    const updateData = {
      name: data.name,
      org_type: data.orgType as any,
      parent_id: data.parentId,
      zone_id: data.zoneId,
      address_line: data.addressLine,
      is_active: data.isActive,
    };

    // Remove undefined fields so we don't send an empty update to Prisma if no primitive fields changed
    Object.keys(updateData).forEach(
      (key) =>
        updateData[key as keyof typeof updateData] === undefined &&
        delete updateData[key as keyof typeof updateData],
    );

    if (Object.keys(updateData).length > 0) {
      await this.prisma.client.organization_unit.update({
        where: { id },
        data: updateData,
      });
    }

    if (location) {
      await this.prisma.client.$executeRawUnsafe(
        `UPDATE organization_unit SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
        location.longitude,
        location.latitude,
        id,
      );
    }

    if (coverageLocations !== undefined) {
      await this.prisma.client.org_unit_location_mapping.deleteMany({
        where: { organization_unit_id: id },
      });

      if (coverageLocations.length > 0) {
        await this.prisma.client.org_unit_location_mapping.createMany({
          data: coverageLocations.map((cov) => ({
            tenant_id: tenantId,
            organization_unit_id: id,
            global_location_id: cov.globalLocationId,
            coverage_type: cov.coverageType || CoverageType.DELIVERY_AREA,
          })),
        });
      }
    }

    return { id };
  }

  async addLocations(
    tenantId: string,
    orgUnitId: string,
    locations: OrgUnitLocationMappingDto[],
  ): Promise<void> {
    const mappingData = locations.map((cov) => ({
      tenant_id: tenantId,
      organization_unit_id: orgUnitId,
      global_location_id: cov.globalLocationId,
      coverage_type: cov.coverageType || 'DELIVERY_AREA',
    }));

    await this.prisma.client.org_unit_location_mapping.createMany({
      data: mappingData,
      skipDuplicates: true,
    });
  }
}
