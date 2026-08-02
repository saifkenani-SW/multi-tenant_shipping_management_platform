import { Inject, Injectable } from '@nestjs/common';
import type { IEmployeeQueryService } from '../interfaces/employee.query.service.interface';
import { Principal } from '../../../packages/context/principal/principal/Principal';

@Injectable()
export class EmployeeFacade {
  constructor(
    @Inject('IEmployeeQueryService')
    private readonly employeeQueryService: IEmployeeQueryService,
  ) {}

  /**
   * Retrieves the Principal object for an employee, including all their
   * assigned branches and warehouses along with their respective access roles.
   */
  async getPrincipalByUserId(
    userId: string,
    tenantId: string,
  ): Promise<Partial<Principal> | null> {
    return this.employeeQueryService.getPrincipalByUserId(userId, tenantId);
  }
}
