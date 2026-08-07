import { Module } from '@nestjs/common';
import { EmployeeController } from './presentation/controllers/employee.controller';
import { EmployeeCommandService } from './application/services/employee.command.service';
import { EmployeeQueryService } from './application/services/employee.query.service';
import { EmployeeCommandRepository } from './infrastructure/repositories/employee.command.repository';
import { EmployeeQueryRepository } from './infrastructure/repositories/employee.query.repository';
import { EmployeeFacade } from './facades/employee.facade';
import { TenantModule } from '../tenant/tenant.module';
import { OrganizationModule } from '../organization/organization.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [
    TenantModule,
    OrganizationModule,
    AuthorizationModule,
  ],
  controllers: [
    EmployeeController,
  ],
  providers: [
    EmployeeCommandService,
    EmployeeQueryService,
    EmployeeCommandRepository,
    EmployeeQueryRepository,
    EmployeeFacade,
  ],
  exports: [
    EmployeeCommandService,
    EmployeeQueryService,
    EmployeeFacade,
  ],
})
export class Employee2Module {}
