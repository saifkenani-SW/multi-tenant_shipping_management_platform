import { EmployeeQueryDto } from '../dtos/requests/employee-query.dto';
import { EmployeeDetailsDto } from '../dtos/responses/employee-details.dto';
import { PaginatedEmployeeListDto } from '../dtos/responses/employee-list.dto';

import { Principal } from '../../../packages/context/principal/principal/Principal';

export interface IEmployeeQueryService {
  findEmployees(query: EmployeeQueryDto): Promise<PaginatedEmployeeListDto>;
  getEmployeeDetails(id: string): Promise<EmployeeDetailsDto>;
  getPrincipalByUserId(userId: string, tenantId: string): Promise<Partial<Principal> | null>;
}
