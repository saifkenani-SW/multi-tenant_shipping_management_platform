import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { BaseUuidParamDto } from '../../core/dtos/base-uuid-param.dto';
import { RequireTypes } from '../auth/authorization/decorators/require-types.decorator';
import { UserTypeGuard } from '../auth/authorization/guards/user-type.guard';
import { UserLoginType } from '../auth/types/auth.types';
import { AssignmentParamsDto } from './dtos/requests/assignment-params.dto';
import { AssignEmployeeDto } from './dtos/requests/assign-employee.dto';
import { CreateEmployeeDto } from './dtos/requests/create-employee.dto';
import { EmployeeQueryDto } from './dtos/requests/employee-query.dto';
import { SetAssignmentRolesDto } from './dtos/requests/set-assignment-roles.dto';
import { UpdateEmployeeDto } from './dtos/requests/update-employee.dto';
import { EmployeeDetailsDto } from './dtos/responses/employee-details.dto';
import { PaginatedEmployeeListDto } from './dtos/responses/employee-list.dto';
import type { IEmployeeCommandService } from './interfaces/employee.command.service.interface';
import type { IEmployeeQueryService } from './interfaces/employee.query.service.interface';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(UserTypeGuard)
@Controller('employees')
export class EmployeeController {
  constructor(
    @Inject('IEmployeeCommandService')
    private readonly commandService: IEmployeeCommandService,
    @Inject('IEmployeeQueryService')
    private readonly queryService: IEmployeeQueryService,
  ) {}

  @Post()
  @RequireTypes(UserLoginType.PLATFORM_OWNER, UserLoginType.EMPLOYEE)
  @ApiOperation({
    summary: 'Create an employee',
    description: 'Creates the login account and the employee record together.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Employee created successfully',
  })
  async createEmployee(
    @Body() dto: CreateEmployeeDto,
  ): Promise<{ id: string }> {
    const id = await this.commandService.createEmployee(dto);
    return { id };
  }

  @Get()
  @RequireTypes(UserLoginType.PLATFORM_OWNER, UserLoginType.EMPLOYEE)
  @ApiOperation({ summary: 'List employees' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of employees',
    type: PaginatedEmployeeListDto,
  })
  async getEmployees(
    @Query() query: EmployeeQueryDto,
  ): Promise<PaginatedEmployeeListDto> {
    return this.queryService.findEmployees(query);
  }

  @Get(':id')
  @RequireTypes(UserLoginType.PLATFORM_OWNER, UserLoginType.EMPLOYEE)
  @ApiOperation({ summary: 'Get employee details with assignments and roles' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Employee details',
    type: EmployeeDetailsDto,
  })
  async getEmployeeDetails(
    @Param() params: BaseUuidParamDto,
  ): Promise<EmployeeDetailsDto> {
    return this.queryService.getEmployeeDetails(params.id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RequireTypes(UserLoginType.PLATFORM_OWNER, UserLoginType.EMPLOYEE)
  @ApiOperation({
    summary: 'Update employee details',
    description: 'Email and password are account data and change elsewhere.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Employee updated successfully',
  })
  async updateEmployee(
    @Param() params: BaseUuidParamDto,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<void> {
    await this.commandService.updateEmployee(params.id, dto);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @RequireTypes(UserLoginType.PLATFORM_OWNER, UserLoginType.EMPLOYEE)
  @ApiOperation({
    summary: 'Deactivate an employee',
    description: 'Revokes access immediately by clearing the permission cache.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Employee deactivated successfully',
  })
  async deactivateEmployee(@Param() params: BaseUuidParamDto): Promise<void> {
    await this.commandService.deactivateEmployee(params.id);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @RequireTypes(UserLoginType.PLATFORM_OWNER, UserLoginType.EMPLOYEE)
  @ApiOperation({ summary: 'Reactivate an employee' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Employee activated successfully',
  })
  async activateEmployee(@Param() params: BaseUuidParamDto): Promise<void> {
    await this.commandService.activateEmployee(params.id);
  }

  @Post(':id/assignments')
  @RequireTypes(UserLoginType.PLATFORM_OWNER, UserLoginType.EMPLOYEE)
  @ApiOperation({ summary: 'Assign the employee to an organization unit' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Assignment created successfully',
  })
  async assignEmployee(
    @Param() params: BaseUuidParamDto,
    @Body() dto: AssignEmployeeDto,
  ): Promise<{ id: string }> {
    const id = await this.commandService.assignEmployee(params.id, dto);
    return { id };
  }

  @Put(':id/assignments/:assignmentId/roles')
  @HttpCode(HttpStatus.OK)
  @RequireTypes(UserLoginType.PLATFORM_OWNER, UserLoginType.EMPLOYEE)
  @ApiOperation({
    summary: 'Replace the roles granted at an assignment',
    description: 'The submitted list becomes the full set of roles.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assignment roles updated successfully',
  })
  async setAssignmentRoles(
    @Param() params: AssignmentParamsDto,
    @Body() dto: SetAssignmentRolesDto,
  ): Promise<void> {
    await this.commandService.setAssignmentRoles(
      params.id,
      params.assignmentId,
      dto,
    );
  }

  @Delete(':id/assignments/:assignmentId')
  @HttpCode(HttpStatus.OK)
  @RequireTypes(UserLoginType.PLATFORM_OWNER, UserLoginType.EMPLOYEE)
  @ApiOperation({ summary: 'Remove an assignment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assignment removed successfully',
  })
  async removeAssignment(@Param() params: AssignmentParamsDto): Promise<void> {
    await this.commandService.removeAssignment(params.id, params.assignmentId);
  }
}
