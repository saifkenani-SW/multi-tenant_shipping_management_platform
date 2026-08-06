import { PartialType } from '@nestjs/swagger';
import { CreateTenantZoneDto } from './create-tenant-zone.dto';

export class UpdateTenantZoneDto extends PartialType(CreateTenantZoneDto) {}
