import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { Transactional } from '../../../packages/transaction';
import { CacheEvict } from '../../../infrastructure/cache/decorators/CacheEvict';

import { Authorize } from '../../../packages/authorization';
import { Policy } from '../../../packages/authorization/policy';
import { RequestContextService } from '../../../packages/context/services/request-context.service';
import { PermissionCacheService } from '../../auth/authorization/services/permission-cache.service';
import { EmployeeAction, EmployeePolicy } from '../authorization';
import { EMPLOYEE_CACHE_KEYS } from '../constants/employee.cache.constants';
import { AssignEmployeeDto } from '../dtos/requests/assign-employee.dto';
import { CreateEmployeeDto } from '../dtos/requests/create-employee.dto';
import { SetAssignmentRolesDto } from '../dtos/requests/set-assignment-roles.dto';
import { UpdateEmployeeDto } from '../dtos/requests/update-employee.dto';
import { AssignmentNotFoundException } from '../exceptions/assignment-not-found.exception';
import { CrossTenantAssignmentException } from '../exceptions/cross-tenant-assignment.exception';
import { DuplicateAssignmentException } from '../exceptions/duplicate-assignment.exception';
import { DuplicateEmployeeCodeException } from '../exceptions/duplicate-employee-code.exception';
import { EmailAlreadyRegisteredException } from '../exceptions/email-already-registered.exception';
import { EmployeeNotFoundException } from '../exceptions/employee-not-found.exception';
import { MissingTenantContextException } from '../exceptions/missing-tenant-context.exception';
import type { IEmployeeCommandRepository } from '../interfaces/employee.command.repository.interface';
import { IEmployeeCommandService } from '../interfaces/employee.command.service.interface';
import type { IEmployeeQueryRepository } from '../interfaces/employee.query.repository.interface';
import {
  EMPLOYEE_COMMAND_REPOSITORY_TOKEN,
  EMPLOYEE_QUERY_REPOSITORY_TOKEN,
} from '../tokens/employee-repository.tokens';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class EmployeeCommandService implements IEmployeeCommandService {
  constructor(
    @Inject(EMPLOYEE_COMMAND_REPOSITORY_TOKEN)
    private readonly commandRepository: IEmployeeCommandRepository,
    @Inject(EMPLOYEE_QUERY_REPOSITORY_TOKEN)
    private readonly queryRepository: IEmployeeQueryRepository,
    private readonly permissionCacheService: PermissionCacheService,
    private readonly requestContext: RequestContextService,
    // مطلوب بهذا الاسم تحديداً لأن @Transactional() يبحث عن this.prisma
  ) {}

  @CacheEvict({ keyPrefix: EMPLOYEE_CACHE_KEYS.LIST, allEntries: true })
  @Authorize({
    policy: Policy(EmployeePolicy, EmployeeAction.Create),
    payloadResolver: (dto: CreateEmployeeDto) => ({ dto }),
  })
  @Transactional()
  async createEmployee(dto: CreateEmployeeDto): Promise<string> {
    const tenantId = this.resolveTenantId();

    // users.email فريد على مستوى المنصة، فالفحص قبل الإنشاء يعطي رسالة
    // مفهومة بدل خطأ قيد فريد خام.
    if (await this.queryRepository.existsByEmail(dto.email)) {
      throw new EmailAlreadyRegisteredException();
    }

    if (
      await this.queryRepository.existsByEmployeeCode(
        tenantId,
        dto.employeeCode,
      )
    ) {
      throw new DuplicateEmployeeCodeException(dto.employeeCode);
    }

    if (dto.organizationUnitId) {
      await this.assertUnitBelongsToTenant(dto.organizationUnitId, tenantId);
    }

    if (dto.roleIds?.length) {
      await this.assertRolesBelongToTenant(dto.roleIds, tenantId);
    }

    // TODO: حدّ max_employees في خطة الاشتراك مؤجل باتفاق.

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // الحساب والموظف يُنشآن معاً: موظف بلا حساب لا يستطيع الدخول،
    // وحساب بلا موظف يتيم. @Transactional() يضمن أن يسقطا معاً.
    const userId = await this.commandRepository.createUser({
      email: dto.email,
      phone: dto.phone ?? null,
      passwordHash,
    });

    const employeeId = await this.commandRepository.create({
      tenantId,
      userId,
      employeeCode: dto.employeeCode,
      fullName: dto.fullName,
      nationalId: dto.nationalId ?? null,
    });

    if (dto.organizationUnitId) {
      await this.commandRepository.createAssignment({
        tenantId,
        employeeId,
        organizationUnitId: dto.organizationUnitId,
        roleIds: dto.roleIds ?? [],
      });
    }

    return employeeId;
  }

  @CacheEvict({ keyPrefix: EMPLOYEE_CACHE_KEYS.LIST, allEntries: true })
  @CacheEvict({
    keyPrefix: EMPLOYEE_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [EMPLOYEE_CACHE_KEYS.DETAILS, id],
  })
  @Authorize({
    policy: Policy(EmployeePolicy, EmployeeAction.Update),
    payloadResolver: (employeeId: string, dto: UpdateEmployeeDto) => ({
      employeeId,
      dto,
    }),
  })
  async updateEmployee(id: string, dto: UpdateEmployeeDto): Promise<void> {
    const employee = await this.requireEmployee(id);

    if (
      dto.employeeCode &&
      dto.employeeCode !== employee.employeeCode &&
      (await this.queryRepository.existsByEmployeeCode(
        employee.tenantId,
        dto.employeeCode,
        id,
      ))
    ) {
      throw new DuplicateEmployeeCodeException(dto.employeeCode);
    }

    await this.commandRepository.update(id, {
      fullName: dto.fullName,
      nationalId: dto.nationalId,
      employeeCode: dto.employeeCode,
    });
  }

  @CacheEvict({ keyPrefix: EMPLOYEE_CACHE_KEYS.LIST, allEntries: true })
  @CacheEvict({
    keyPrefix: EMPLOYEE_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [EMPLOYEE_CACHE_KEYS.DETAILS, id],
  })
  @Authorize({
    policy: Policy(EmployeePolicy, EmployeeAction.ChangeStatus),
    payloadResolver: (employeeId: string) => ({ employeeId }),
  })
  async deactivateEmployee(id: string): Promise<void> {
    const employee = await this.requireEmployee(id);

    await this.commandRepository.setActiveState(id, false);

    // بدون هذا السطر يبقى الموظف المفصول قادراً على العمل حتى ساعة:
    // الحُرّاس تقرأ أدواره ونطاقاته من كاش عمره 3600 ثانية.
    await this.permissionCacheService.invalidateUserAccess(employee.userId);
  }

  @CacheEvict({ keyPrefix: EMPLOYEE_CACHE_KEYS.LIST, allEntries: true })
  @CacheEvict({
    keyPrefix: EMPLOYEE_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [EMPLOYEE_CACHE_KEYS.DETAILS, id],
  })
  @Authorize({
    policy: Policy(EmployeePolicy, EmployeeAction.ChangeStatus),
    payloadResolver: (employeeId: string) => ({ employeeId }),
  })
  async activateEmployee(id: string): Promise<void> {
    const employee = await this.requireEmployee(id);

    await this.commandRepository.setActiveState(id, true);
    await this.permissionCacheService.invalidateUserAccess(employee.userId);
  }

  @CacheEvict({
    keyPrefix: EMPLOYEE_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [EMPLOYEE_CACHE_KEYS.DETAILS, id],
  })
  @CacheEvict({ keyPrefix: EMPLOYEE_CACHE_KEYS.LIST, allEntries: true })
  @Authorize({
    policy: Policy(EmployeePolicy, EmployeeAction.ManageAssignments),
    payloadResolver: (employeeId: string) => ({ employeeId }),
  })
  @Transactional()
  async assignEmployee(id: string, dto: AssignEmployeeDto): Promise<string> {
    const employee = await this.requireEmployee(id);

    await this.assertUnitBelongsToTenant(
      dto.organizationUnitId,
      employee.tenantId,
    );

    if (dto.roleIds?.length) {
      await this.assertRolesBelongToTenant(dto.roleIds, employee.tenantId);
    }

    if (
      await this.queryRepository.existsAssignment(id, dto.organizationUnitId)
    ) {
      throw new DuplicateAssignmentException();
    }

    const assignmentId = await this.commandRepository.createAssignment({
      tenantId: employee.tenantId,
      employeeId: id,
      organizationUnitId: dto.organizationUnitId,
      roleIds: dto.roleIds ?? [],
    });

    await this.permissionCacheService.invalidateUserAccess(employee.userId);

    return assignmentId;
  }

  @CacheEvict({
    keyPrefix: EMPLOYEE_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [EMPLOYEE_CACHE_KEYS.DETAILS, id],
  })
  @CacheEvict({ keyPrefix: EMPLOYEE_CACHE_KEYS.LIST, allEntries: true })
  @Authorize({
    policy: Policy(EmployeePolicy, EmployeeAction.ManageAssignments),
    payloadResolver: (employeeId: string) => ({ employeeId }),
  })
  async removeAssignment(id: string, assignmentId: string): Promise<void> {
    const employee = await this.requireEmployee(id);

    await this.requireAssignmentOf(assignmentId, id);

    await this.commandRepository.removeAssignment(assignmentId);
    await this.permissionCacheService.invalidateUserAccess(employee.userId);
  }

  @CacheEvict({
    keyPrefix: EMPLOYEE_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [EMPLOYEE_CACHE_KEYS.DETAILS, id],
  })
  @Authorize({
    policy: Policy(EmployeePolicy, EmployeeAction.ManageAssignments),
    payloadResolver: (employeeId: string) => ({ employeeId }),
  })
  @Transactional()
  async setAssignmentRoles(
    id: string,
    assignmentId: string,
    dto: SetAssignmentRolesDto,
  ): Promise<void> {
    const employee = await this.requireEmployee(id);

    await this.requireAssignmentOf(assignmentId, id);
    await this.assertRolesBelongToTenant(dto.roleIds, employee.tenantId);

    await this.commandRepository.setAssignmentRoles(assignmentId, dto.roleIds);

    await this.permissionCacheService.invalidateUserAccess(employee.userId);
  }

  private async requireEmployee(id: string) {
    const employee = await this.queryRepository.findById(id);

    if (!employee) {
      throw new EmployeeNotFoundException();
    }

    return employee;
  }

  /**
   * يمنع تمرير معرّف تعيين يخص موظفاً آخر: المسار يحمل معرّف الموظف،
   * والتفويض فُحص عليه، فلا يصح أن يعدّل تعيين شخص ثالث.
   */
  private async requireAssignmentOf(
    assignmentId: string,
    employeeId: string,
  ): Promise<void> {
    const assignment = await this.queryRepository.findAssignment(assignmentId);

    if (!assignment || assignment.employeeId !== employeeId) {
      throw new AssignmentNotFoundException();
    }
  }

  /**
   * وحدة من شركة أخرى تمنح الموظف موضعاً خارج شركته. المفتاح الأجنبي
   * لا يقارن tenant_id.
   */
  private async assertUnitBelongsToTenant(
    unitId: string,
    tenantId: string,
  ): Promise<void> {
    const unitTenantId =
      await this.queryRepository.findOrganizationUnitTenant(unitId);

    if (unitTenantId === null || unitTenantId !== tenantId) {
      throw new CrossTenantAssignmentException('organization unit');
    }
  }

  /**
   * دور من شركة أخرى يمنح صلاحيات خارج الشركة — أخطر تسريب في الموديول.
   */
  private async assertRolesBelongToTenant(
    roleIds: readonly string[],
    tenantId: string,
  ): Promise<void> {
    if (roleIds.length === 0) {
      return;
    }

    const rows = await this.queryRepository.findRoleTenants(roleIds);

    if (rows.length !== roleIds.length) {
      throw new CrossTenantAssignmentException('role');
    }

    if (rows.some((row) => row.tenantId !== tenantId)) {
      throw new CrossTenantAssignmentException('role');
    }
  }

  private resolveTenantId(): string {
    const tenantId = this.requestContext.getPrincipal()?.tenantId;

    if (!tenantId) {
      throw new MissingTenantContextException();
    }

    return tenantId;
  }
}
