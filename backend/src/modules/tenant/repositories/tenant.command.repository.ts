import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
  ITenantCommandRepository,
  TenantData,
} from '../interfaces/tenant.command.repository.interface';
import { TenantStatus } from '../enums/tenant-status.enum';

@Injectable()
export class TenantCommandRepository implements ITenantCommandRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Omit<TenantData, 'id' | 'status'>): Promise<string> {
    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        tax_number: data.taxNumber,
        email: data.contactEmail,
        is_active: true,
      },
    });
    return tenant.id;
  }

  async findById(id: string): Promise<TenantData | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });
    if (!tenant) return null;

    return {
      id: tenant.id,
      name: tenant.name,
      status: tenant.is_active ? TenantStatus.ACTIVE : TenantStatus.SUSPENDED,
      taxNumber: tenant.tax_number || '',
      contactEmail: tenant.email || '',
    };
  }

  async update(
    id: string,
    data: Partial<Omit<TenantData, 'id' | 'status'>>,
  ): Promise<void> {
    await this.prisma.tenant.update({
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

    await this.prisma.tenant.update({
      where: { id },
      data: {
        is_active,
        suspended_at,
        suspended_reason,
      },
    });
  }
}
