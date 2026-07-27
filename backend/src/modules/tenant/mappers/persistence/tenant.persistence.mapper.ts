import { Injectable } from '@nestjs/common';
import { Tenant } from '../../domain/tenant.entity';
import { TenantStatus } from '../../enums/tenant-status.enum';

export interface TenantPersistenceRecord {
  readonly id: string;
  readonly name: string;
  readonly is_active: boolean;
  readonly tax_number: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly logo_url: string | null;
  readonly created_at: Date;
  readonly updated_at: Date;
  readonly suspended_at: Date | null;
  readonly suspended_reason: string | null;
}

@Injectable()
export class TenantPersistenceMapper {
  toDomain(record: TenantPersistenceRecord): Tenant {
    return new Tenant(
      record.id,
      record.name,
      record.is_active ? TenantStatus.ACTIVE : TenantStatus.SUSPENDED,
      record.tax_number,
      record.email,
      record.created_at,
      record.updated_at,
      record.suspended_at,
      record.suspended_reason,
      record.phone,
      record.logo_url,
      record.is_active,
    );
  }
}
