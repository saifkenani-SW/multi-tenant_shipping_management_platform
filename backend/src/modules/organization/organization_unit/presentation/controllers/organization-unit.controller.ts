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
import { OrganizationUnitCommandService } from '../../application/services/organization-unit.command.service';
import { OrganizationUnitQueryService } from '../../application/services/organization-unit.query.service';
import { CreateOrganizationUnitDto } from '../../application/dtos/requests/create-organization-unit.dto';
import { UpdateOrganizationUnitDto } from '../../application/dtos/requests/update-organization-unit.dto';
import { AddLocationsDto } from '../../application/dtos/requests/add-locations.dto';
import { OrganizationUnitQueryDto } from '../../application/dtos/requests/organization-unit-query.dto';
import { Roles } from '../../../../../common/authorization/decorators/roles.decorator';
import { RoleType } from '../../../../authorization/domain/enums/role.enum';
import { RequestContextService } from '../../../../../packages/context/services/request-context.service';

@ApiTags('Organization Units')
@ApiBearerAuth()
@Controller('organization-units')
export class OrganizationUnitController {
  constructor(
    private readonly commandService: OrganizationUnitCommandService,
    private readonly queryService: OrganizationUnitQueryService,
    private readonly requestContext: RequestContextService,
  ) {}

  @Post()
  @Roles(RoleType.TENANT_ADMIN)
  async create(@Body() dto: CreateOrganizationUnitDto) {
    return this.commandService.create(
      this.requestContext.getTenantIdOrThrow(),
      dto,
    );
  }

  @Get()
  @Roles(
    RoleType.PLATFORM_OWNER,
    RoleType.TENANT_ADMIN,
    RoleType.EMPLOYEE,
    RoleType.DRIVER,
  )
  @ApiCursorPaginationQuery()
  async findMany(@Query() query: OrganizationUnitQueryDto) {
    return this.queryService.findMany(query, this.requestContext.getTenantId());
  }

  @Get(':id')
  @Roles(
    RoleType.PLATFORM_OWNER,
    RoleType.TENANT_ADMIN,
    RoleType.EMPLOYEE,
    RoleType.DRIVER,
  )
  async findById(@Param('id') id: string) {
    return this.queryService.findById(id, this.requestContext.getTenantId());
  }

  @Patch(':id')
  @Roles(RoleType.TENANT_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationUnitDto,
  ) {
    return this.commandService.update(
      this.requestContext.getTenantIdOrThrow(),
      id,
      dto,
    );
  }

  @Post(':id/locations')
  @Roles(RoleType.TENANT_ADMIN)
  async addLocations(@Param('id') id: string, @Body() dto: AddLocationsDto) {
    await this.commandService.addLocations(
      this.requestContext.getTenantIdOrThrow(),
      id,
      dto,
    );
    return { success: true };
  }
}
