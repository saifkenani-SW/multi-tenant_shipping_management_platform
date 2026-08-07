import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Transactional } from '../../../../packages/transaction';
import { EmployeeCommandRepository } from '../../infrastructure/repositories/employee.command.repository';
import { EmployeeQueryService } from './employee.query.service';
import { TenantFacade } from '../../../tenant/application/facades/tenant.facade';
import { OrganizationFacade } from '../../../organization/facades/organization.facade';
import { CreateEmployeeDto } from '../dtos/requests/create-employee.dto';
import { UpdateEmployeeDto } from '../dtos/requests/update-employee.dto';
import { AddEmployeeAssignmentsDto } from '../dtos/requests/add-employee-assignments.dto';
import { CacheEvict } from '../../../../infrastructure/cache/decorators/CacheEvict';
import { EMPLOYEE_CACHE_KEYS } from '../../constants/employee.cache.constants';

@Injectable()
export class EmployeeCommandService {
  constructor(
    private readonly commandRepository: EmployeeCommandRepository,
    private readonly queryService: EmployeeQueryService,
    private readonly tenantFacade: TenantFacade,
    private readonly organizationFacade: OrganizationFacade,
  ) {}

  @CacheEvict({
    keyPrefix: EMPLOYEE_CACHE_KEYS.PREFIX,
    keyBuilder: (tenantId: string, dto: CreateEmployeeDto) => [
      EMPLOYEE_CACHE_KEYS.LIST,
      tenantId,
    ],
  })
  @Transactional()
  async create(tenantId: string, dto: CreateEmployeeDto) {
    const maxEmployees =
      await this.tenantFacade.getMaxEmployeesAllowed(tenantId);
    const currentCount = await this.queryService.countByTenantId(tenantId);

    if (maxEmployees > 0 && currentCount >= maxEmployees) {
      throw new BadRequestException(
        'تم تجاوز الحد الأقصى للموظفين المسموح به في اشتراكك',
      );
    }

    return this.commandRepository.create(tenantId, dto);
  }

  @CacheEvict({
    keyPrefix: EMPLOYEE_CACHE_KEYS.PREFIX,
    keyBuilder: (id: string, tenantId: string, dto: UpdateEmployeeDto) => [
      EMPLOYEE_CACHE_KEYS.DETAILS,
      tenantId,
      id,
    ],
  })
  @CacheEvict({
    keyPrefix: EMPLOYEE_CACHE_KEYS.PREFIX,
    keyBuilder: (id: string, tenantId: string, dto: UpdateEmployeeDto) => [
      EMPLOYEE_CACHE_KEYS.LIST,
      tenantId,
    ],
  })
  @Transactional()
  async update(id: string, tenantId: string, dto: UpdateEmployeeDto) {
    await this.queryService.findById(id, tenantId);

    return this.commandRepository.update(id, tenantId, dto);
  }

  @CacheEvict({
    keyPrefix: EMPLOYEE_CACHE_KEYS.PREFIX,
    keyBuilder: (id: string, tenantId: string) => [
      EMPLOYEE_CACHE_KEYS.DETAILS,
      tenantId,
      id,
    ],
  })
  @CacheEvict({
    keyPrefix: EMPLOYEE_CACHE_KEYS.PREFIX,
    keyBuilder: (id: string, tenantId: string) => [
      EMPLOYEE_CACHE_KEYS.LIST,
      tenantId,
    ],
  })
  @Transactional()
  async delete(id: string, tenantId: string) {
    await this.queryService.findById(id, tenantId);
    return this.commandRepository.delete(id, tenantId);
  }

  @CacheEvict({
    keyPrefix: EMPLOYEE_CACHE_KEYS.PREFIX,
    keyBuilder: (
      tenantId: string,
      employeeId: string,
      dto: AddEmployeeAssignmentsDto,
    ) => [EMPLOYEE_CACHE_KEYS.DETAILS, tenantId, employeeId],
  })
  @CacheEvict({
    keyPrefix: EMPLOYEE_CACHE_KEYS.PREFIX,
    keyBuilder: (
      tenantId: string,
      employeeId: string,
      dto: AddEmployeeAssignmentsDto,
    ) => [EMPLOYEE_CACHE_KEYS.LIST, tenantId],
  })
  @Transactional()
  async addAssignments(
    tenantId: string,
    employeeId: string,
    dto: AddEmployeeAssignmentsDto,
  ) {
    await this.queryService.findById(employeeId, tenantId);

    const { organizationUnitIds } = dto;
    const unitsExist =
      await this.organizationFacade.validateOrganizationUnitsExist(
        tenantId,
        organizationUnitIds,
      );
    if (!unitsExist) {
      throw new BadRequestException(
        'بعض الوحدات التنظيمية غير موجودة أو لا تنتمي لنفس مساحة العمل',
      );
    }

    return this.commandRepository.addAssignments(
      tenantId,
      employeeId,
      organizationUnitIds,
    );
  }
}
