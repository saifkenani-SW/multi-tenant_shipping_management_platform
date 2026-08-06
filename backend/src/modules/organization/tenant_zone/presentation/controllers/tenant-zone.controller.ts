import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiCursorPaginationQuery } from '../../../../../common/pagination/cursor/decorators/api-cursor-pagination-query.decorator';
import { TenantZoneCommandService } from '../../application/services/tenant-zone.command.service';
import { TenantZoneQueryService } from '../../application/services/tenant-zone.query.service';
import { CreateTenantZoneDto } from '../../application/dtos/requests/create-tenant-zone.dto';
import { UpdateTenantZoneDto } from '../../application/dtos/requests/update-tenant-zone.dto';
import { TenantZoneQueryDto } from '../../application/dtos/requests/tenant-zone-query.dto';
import { RequestContextService } from '../../../../../packages/context/services/request-context.service';
import { Roles } from 'src/common/authorization';
import { RoleType } from '../../../../authorization';

@ApiTags('Tenant Zones')
@ApiBearerAuth()
@Controller('tenant-zones')
export class TenantZoneController {
  constructor(
    private readonly commandService: TenantZoneCommandService,
    private readonly queryService: TenantZoneQueryService,
    private readonly requestContext: RequestContextService,
  ) {}

  @Post()
  @Roles(RoleType.TENANT_ADMIN)
  async create(@Body() dto: CreateTenantZoneDto) {
    const tenantId = this.requestContext.getTenantIdOrThrow();
    return this.commandService.create(tenantId, dto);
  }

  @Get()
  @Roles(RoleType.PLATFORM_OWNER, RoleType.TENANT_ADMIN)
  @ApiCursorPaginationQuery()
  async findMany(@Query() query: TenantZoneQueryDto) {
    const tenantId = this.requestContext.getTenantId();
    return this.queryService.findMany(query, tenantId);
  }

  @Get(':id')
  @Roles(RoleType.PLATFORM_OWNER, RoleType.TENANT_ADMIN)
  async findById(@Param('id') id: string) {
    const tenantId = this.requestContext.getTenantId();
    return this.queryService.findById(id, tenantId);
  }

  @Patch(':id')
  @Roles(RoleType.TENANT_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateTenantZoneDto) {
    const tenantId = this.requestContext.getTenantIdOrThrow();
    return this.commandService.update(tenantId, id, dto);
  }
}
