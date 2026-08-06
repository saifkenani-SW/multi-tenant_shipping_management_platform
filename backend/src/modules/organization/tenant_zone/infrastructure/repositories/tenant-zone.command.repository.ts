import { Injectable } from '@nestjs/common';
import { TransactionalPrismaService } from '../../../../../packages/transaction/services/transactional-prisma.service';
import { CreateTenantZoneDto } from '../../application/dtos/requests/create-tenant-zone.dto';
import { UpdateTenantZoneDto } from '../../application/dtos/requests/update-tenant-zone.dto';

@Injectable()
export class TenantZoneCommandRepository {
  constructor(private readonly prisma: TransactionalPrismaService) {}

  async create(
    tenantId: string,
    dto: CreateTenantZoneDto,
  ): Promise<{ id: string }> {
    const created = await this.prisma.client.tenant_zone.create({
      data: {
        tenant_id: tenantId,
        name: dto.name,
        description: dto.description,
        is_active: dto.isActive ?? true,
      },
      select: { id: true },
    });
    return { id: created.id };
  }

  async update(id: string, dto: UpdateTenantZoneDto): Promise<{ id: string }> {
    const updateData = {
      name: dto.name,
      description: dto.description,
      is_active: dto.isActive,
    };

    // Remove undefined properties to avoid empty updates if no fields are provided
    Object.keys(updateData).forEach(
      (key) =>
        updateData[key as keyof typeof updateData] === undefined &&
        delete updateData[key as keyof typeof updateData],
    );

    if (Object.keys(updateData).length > 0) {
      await this.prisma.client.tenant_zone.update({
        where: { id },
        data: updateData,
      });
    }

    return { id };
  }
}
