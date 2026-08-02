import { Injectable } from '@nestjs/common';

import { Permission } from '../../domain/permission.entity';

export interface PermissionPersistenceRecord {
  readonly id: string;
  readonly name: string;
  readonly resource: string;
  readonly action: string;
  readonly description: string | null;
}

@Injectable()
export class PermissionPersistenceMapper {
  toDomain(record: PermissionPersistenceRecord): Permission {
    return new Permission(
      record.id,
      record.name,
      record.resource,
      record.action,
      record.description,
    );
  }
}
