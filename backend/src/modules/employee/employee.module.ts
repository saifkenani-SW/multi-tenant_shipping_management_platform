import { Module } from '@nestjs/common';

import { CacheModule } from '../../infrastructure/cache/cache.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CaslModule } from '../../packages/authorization-casl';
import { AuthModule } from '../auth/auth.module';
import {
  EmployeeAbility,
  EmployeePolicy,
  EmployeeVisibilityScope,
} from './authorization';
import { EmployeeCapabilityBuilder } from './authorization/capabilities/employee-capability.builder';
import { ChangeEmployeeStatusStrategy } from './authorization/policies/strategies/change-employee-status.strategy';
import { CreateEmployeeStrategy } from './authorization/policies/strategies/create-employee.strategy';
import { ManageAssignmentsStrategy } from './authorization/policies/strategies/manage-assignments.strategy';
import { EmployeeStrategyRegistry } from './authorization/policies/strategies/registry/employee-strategy.registry';
import { UpdateEmployeeStrategy } from './authorization/policies/strategies/update-employee.strategy';
import { ViewEmployeeStrategy } from './authorization/policies/strategies/view-employee.strategy';
import { EmployeeQueryCriteriaBuilder } from './builders/query/employee-query-criteria.builder';
import { EmployeeController } from './employee.controller';
import { EmployeePersistenceMapper } from './mappers/persistence/employee.persistence.mapper';
import { EmployeeResponseMapper } from './mappers/response/employee.response.mapper';
import { EmployeeCommandRepository } from './repositories/employee.command.repository';
import { EmployeeQueryRepository } from './repositories/employee.query.repository';
import { EmployeeCommandService } from './services/employee.command.service';
import { EmployeeQueryService } from './services/employee.query.service';
import {
  EMPLOYEE_COMMAND_REPOSITORY_TOKEN,
  EMPLOYEE_QUERY_REPOSITORY_TOKEN,
} from './tokens/employee-repository.tokens';

@Module({
  imports: [
    CacheModule,
    DatabaseModule,
    // مطلوب لـ PermissionCacheService: تغيير التعيينات أو التعطيل يبطل
    // كاش الحُرّاس، وبدونه يظل الموظف المفصول عاملاً حتى ساعة.
    AuthModule,
    CaslModule.forFeature([EmployeeAbility]),
  ],
  controllers: [EmployeeController],
  providers: [
    // Repositories
    {
      provide: EMPLOYEE_COMMAND_REPOSITORY_TOKEN,
      useClass: EmployeeCommandRepository,
    },
    {
      provide: EMPLOYEE_QUERY_REPOSITORY_TOKEN,
      useClass: EmployeeQueryRepository,
    },

    // Services
    {
      provide: 'IEmployeeCommandService',
      useClass: EmployeeCommandService,
    },
    {
      provide: 'IEmployeeQueryService',
      useClass: EmployeeQueryService,
    },

    // Builders
    EmployeeQueryCriteriaBuilder,

    // Mappers
    EmployeePersistenceMapper,
    EmployeeResponseMapper,

    // Authorization
    EmployeePolicy,
    EmployeeStrategyRegistry,

    CreateEmployeeStrategy,
    ViewEmployeeStrategy,
    UpdateEmployeeStrategy,
    ChangeEmployeeStatusStrategy,
    ManageAssignmentsStrategy,

    // CASL
    EmployeeAbility,

    // Visibility
    EmployeeVisibilityScope,
    EmployeeCapabilityBuilder,
  ],
  exports: [
    'IEmployeeCommandService',
    'IEmployeeQueryService',
    EMPLOYEE_QUERY_REPOSITORY_TOKEN,
    EmployeePolicy,
    EmployeeCapabilityBuilder,
  ],
})
export class EmployeeModule {}
