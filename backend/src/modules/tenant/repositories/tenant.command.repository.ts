import { Injectable } from '@nestjs/common';
import { TransactionalPrismaService } from '../../../core/transaction';
import { ITenantCommandRepository } from '../interfaces/tenant.command.repository.interface';
import { TenantStatus } from '../enums/tenant-status.enum';
import { Tenant } from '../domain/tenant.entity';

@Injectable()
export class TenantCommandRepository implements ITenantCommandRepository {
  constructor(private readonly prisma: TransactionalPrismaService) {}

  async create(data: { name: string; taxNumber: string; contactEmail: string }): Promise<Tenant> {
    const tenant = await this.prisma.client.tenant.create({
      data: {
        name: data.name,
        tax_number: data.taxNumber,
        email: data.contactEmail,
        is_active: true,
      },
    });
    
    return new Tenant(
      tenant.id,
      tenant.name,
      tenant.is_active ? TenantStatus.ACTIVE : TenantStatus.SUSPENDED,
      tenant.tax_number || '',
      tenant.email || '',
      tenant.created_at,
      tenant.updated_at,
      tenant.suspended_at,
      tenant.suspended_reason,
    );
  }

  async findById(id: string): Promise<Tenant | null> {
    const tenant = await this.prisma.client.tenant.findUnique({
      where: { id },
    });
    if (!tenant) return null;

    return new Tenant(
      tenant.id,
      tenant.name,
      tenant.is_active ? TenantStatus.ACTIVE : TenantStatus.SUSPENDED,
      tenant.tax_number || '',
      tenant.email || '',
      tenant.created_at,
      tenant.updated_at,
      tenant.suspended_at,
      tenant.suspended_reason,
    );
  }

  async update(
    id: string,
    data: { name?: string; taxNumber?: string; contactEmail?: string },
  ): Promise<void> {
    await this.prisma.client.tenant.update({
      where: { id },
      data: {
        name: data.name,
        tax_number: data.taxNumber,
        email: data.contactEmail,
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
