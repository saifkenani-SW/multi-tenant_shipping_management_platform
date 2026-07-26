import { Injectable } from '@nestjs/common';
import { TransactionalPrismaService } from '../../../core/transaction';
import { ITenantCommandRepository } from '../interfaces/tenant.command.repository.interface';
import { TenantStatus } from '../enums/tenant-status.enum';
import { Tenant } from '../domain/tenant.entity';
import { TenantPersistenceMapper } from '../mappers/persistence/tenant.persistence.mapper';
import {
  CreateTenantRepositoryData,
  UpdateTenantRepositoryData,
} from '../contracts/persistence/tenant-repository-data.types';

@Injectable()
export class TenantCommandRepository implements ITenantCommandRepository {
  constructor(
    private readonly prisma: TransactionalPrismaService,
    private readonly tenantPersistenceMapper: TenantPersistenceMapper,
  ) {}

  async create(data: CreateTenantRepositoryData): Promise<Tenant> {
    const tenant = await this.prisma.client.tenant.create({
      data: {
        name: data.name,
        tax_number: data.taxNumber,
        email: data.email,
        is_active: true,
      },
    });

    return this.tenantPersistenceMapper.toDomain(tenant);
  }

  async findById(id: string): Promise<Tenant | null> {
    const tenant = await this.prisma.client.tenant.findUnique({
      where: { id },
    });
    if (!tenant) return null;

    return this.tenantPersistenceMapper.toDomain(tenant);
  }

  async update(
    id: string,
    data: UpdateTenantRepositoryData,
  ): Promise<void> {
    await this.prisma.client.tenant.update({
      where: { id },
      data: {
        name: data.name,
        tax_number: data.taxNumber,
        email: data.email,
      },
    });
  }

  async updateStatus(
    id: string,
    status: TenantStatus,
    reason?: string,
  ): Promise<void> {
    const is_active = status === TenantStatus.ACTIVE;
    const suspended_at = is_active ? null : new Date();
    const suspended_reason = is_active ? null : reason || null;

    await this.prisma.client.tenant.update({
      where: { id },
      data: {
        is_active,
        suspended_at,
        suspended_reason,
      },
    });
  }
}
