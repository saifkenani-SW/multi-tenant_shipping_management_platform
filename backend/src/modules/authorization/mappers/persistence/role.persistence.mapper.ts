import { Injectable } from '@nestjs/common';

import { Permission } from '../../domain/permission.entity';
import { Role } from '../../domain/role.entity';

export interface RolePersistenceRecord {
  readonly id: string;
  readonly tenant_id: string;
  readonly name: string;
  readonly description: string | null;
  readonly is_active: boolean;
  readonly created_at: Date;
}

@Injectable()
export class RolePersistenceMapper {
  toDomain(
    record: RolePersistenceRecord,
    permissions: readonly Permission[] = [],
  ): Role {
    return new Role(
      record.id,
      record.tenant_id,
      record.name,
      record.description,
      record.is_active,
      record.created_at,
      permissions,
    );
  }
}
