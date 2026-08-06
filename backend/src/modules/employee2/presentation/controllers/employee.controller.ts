import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EmployeeCommandService } from '../../application/services/employee.command.service';
import { EmployeeQueryService } from '../../application/services/employee.query.service';
import { CreateEmployeeDto } from '../../application/dtos/requests/create-employee.dto';
import { UpdateEmployeeDto } from '../../application/dtos/requests/update-employee.dto';
import { EmployeeQueryDto } from '../../application/dtos/requests/employee-query.dto';
import { AddEmployeeAssignmentsDto } from '../../application/dtos/requests/add-employee-assignments.dto';
import { RequestContextService } from '../../../../packages/context/services/request-context.service';
import { Roles } from '../../../../common/authorization/decorators/roles.decorator';
import { RoleType } from '../../../authorization/domain/enums/role.enum';
import { RolesGuard } from '../../../../common/authorization/guards/roles.guard';

@Controller('employee2')
@UseGuards(RolesGuard)
export class EmployeeController {
  constructor(
    private readonly commandService: EmployeeCommandService,
    private readonly queryService: EmployeeQueryService,
    private readonly requestContext: RequestContextService,
  ) {}

  @Post()
  @Roles(RoleType.TENANT_ADMIN)
  async create(@Body() dto: CreateEmployeeDto) {
    const tenantId = this.requestContext.getTenantIdOrThrow();
    return this.commandService.create(tenantId, dto);
  }

  @Put(':id')
  @Roles(RoleType.TENANT_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    const tenantId = this.requestContext.getTenantIdOrThrow();
    return this.commandService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @Roles(RoleType.TENANT_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    const tenantId = this.requestContext.getTenantIdOrThrow();
    return this.commandService.delete(id, tenantId);
  }

  @Post(':id/assignments')
  @Roles(RoleType.TENANT_ADMIN)
  @HttpCode(HttpStatus.OK)
  async addAssignments(
    @Param('id') id: string,
    @Body() dto: AddEmployeeAssignmentsDto,
  ) {
    const tenantId = this.requestContext.getTenantIdOrThrow();
    return this.commandService.addAssignments(tenantId, id, dto);
  }

  @Get()
  @Roles(RoleType.TENANT_ADMIN, RoleType.PLATFORM_OWNER)
  async findMany(@Query() query: EmployeeQueryDto) {
    const tenantId = this.requestContext.getTenantId();
    return this.queryService.findMany(query, tenantId);
  }

  @Get(':id')
  @Roles(RoleType.TENANT_ADMIN, RoleType.PLATFORM_OWNER)
  async findById(@Param('id') id: string) {
    const tenantId = this.requestContext.getTenantId();
    return this.queryService.findById(id, tenantId);
  }
}
