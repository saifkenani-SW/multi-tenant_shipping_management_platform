import { Module } from '@nestjs/common';
import { EmployeeController } from './presentation/controllers/employee.controller';
import { EmployeeCommandService } from './application/services/employee.command.service';
import { EmployeeQueryService } from './application/services/employee.query.service';
import { EmployeeCommandRepository } from './infrastructure/repositories/employee.command.repository';
import { EmployeeQueryRepository } from './infrastructure/repositories/employee.query.repository';
import { TenantModule } from '../tenant/tenant.module';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [
    TenantModule,
    OrganizationModule,
  ],
  controllers: [
    EmployeeController,
  ],
  providers: [
    EmployeeCommandService,
    EmployeeQueryService,
    EmployeeCommandRepository,
    EmployeeQueryRepository,
  ],
  exports: [
    EmployeeCommandService,
    EmployeeQueryService,
  ],
})
export class Employee2Module {}
