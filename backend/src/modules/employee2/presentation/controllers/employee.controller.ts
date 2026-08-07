import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { Roles } from '../../../../common/authorization';
import { RoleType } from '../../../authorization';

@ApiTags('Employees2')
@ApiBearerAuth()
@Controller('employee2')
export class EmployeeController {
  constructor(
    private readonly commandService: EmployeeCommandService,
    private readonly queryService: EmployeeQueryService,
    private readonly requestContext: RequestContextService,
  ) {}

  @Post()
  @Roles(RoleType.TENANT_ADMIN)
  @ApiOperation({ summary: 'إنشاء موظف جديد' })
  @ApiBody({
    type: CreateEmployeeDto,
    examples: {
      default: {
        summary: 'مثال لبيانات إنشاء موظف',
        value: {
          userId: '00000000-0000-0000-0000-000000000000',
          employeeCode: 'EMP-001',
          fullName: 'John Doe',
          nationalId: '1234567890',
        },
      },
    },
  })
  async create(@Body() dto: CreateEmployeeDto) {
    const tenantId = this.requestContext.getTenantIdOrThrow();
    return this.commandService.create(tenantId, dto);
  }

  @Put(':id')
  @Roles(RoleType.TENANT_ADMIN)
  @ApiOperation({ summary: 'تحديث بيانات موظف' })
  @ApiBody({
    type: UpdateEmployeeDto,
    examples: {
      default: {
        summary: 'مثال لبيانات تحديث موظف',
        value: {
          employeeCode: 'EMP-001-MOD',
          fullName: 'John Doe Updated',
          nationalId: '1234567890',
        },
      },
    },
  })
  async update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    const tenantId = this.requestContext.getTenantIdOrThrow();
    return this.commandService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @Roles(RoleType.TENANT_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'حذف موظف' })
  async delete(@Param('id') id: string) {
    const tenantId = this.requestContext.getTenantIdOrThrow();
    return this.commandService.delete(id, tenantId);
  }

  @Post(':id/assignments')
  @Roles(RoleType.TENANT_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تعيين موظف في وحدات تنظيمية وإسناد الصلاحيات' })
  @ApiBody({
    type: AddEmployeeAssignmentsDto,
    examples: {
      default: {
        summary: 'مثال لبيانات التعيين (الفرع + الصلاحيات)',
        value: {
          assignments: [
            {
              organizationUnitId: '00000000-0000-7000-8000-000000001502',
              roleIds: [
                '00000000-0000-7000-8000-000000001111',
                '00000000-0000-7000-8000-000000002222',
              ],
            },
          ],
        },
      },
    },
  })
  async addAssignments(
    @Param('id') id: string,
    @Body() dto: AddEmployeeAssignmentsDto,
  ) {
    const tenantId = this.requestContext.getTenantIdOrThrow();
    return this.commandService.addAssignments(tenantId, id, dto);
  }

  @Get()
  @Roles(RoleType.TENANT_ADMIN, RoleType.PLATFORM_OWNER)
  @ApiOperation({ summary: 'جلب قائمة الموظفين (مع التصفح والبحث)' })
  async findMany(@Query() query: EmployeeQueryDto) {
    const tenantId = this.requestContext.getTenantId();
    return this.queryService.findMany(query, tenantId);
  }

  @Get(':id')
  @Roles(RoleType.TENANT_ADMIN, RoleType.PLATFORM_OWNER)
  @ApiOperation({ summary: 'جلب بيانات موظف بواسطة المعرف' })
  async findById(@Param('id') id: string) {
    const tenantId = this.requestContext.getTenantId();
    return this.queryService.findById(id, tenantId);
  }

  @Post(':id/activate')
  @Roles(RoleType.TENANT_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إعادة تنشيط موظف' })
  async activate(@Param('id') id: string) {
    const tenantId = this.requestContext.getTenantIdOrThrow();
    return this.commandService.activate(id, tenantId);
  }

  @Post(':id/deactivate')
  @Roles(RoleType.TENANT_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إلغاء تنشيط موظف' })
  async deactivate(@Param('id') id: string) {
    const tenantId = this.requestContext.getTenantIdOrThrow();
    return this.commandService.deactivate(id, tenantId);
  }

  @Delete(':id/assignments/:assignmentId')
  @Roles(RoleType.TENANT_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'إزالة تعيين موظف من وحدة تنظيمية' })
  async removeAssignment(
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    const tenantId = this.requestContext.getTenantIdOrThrow();
    return this.commandService.removeAssignment(id, assignmentId, tenantId);
  }
}
