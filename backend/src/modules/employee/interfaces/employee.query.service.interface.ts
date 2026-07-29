import { EmployeeQueryDto } from '../dtos/requests/employee-query.dto';
import { EmployeeDetailsDto } from '../dtos/responses/employee-details.dto';
import { PaginatedEmployeeListDto } from '../dtos/responses/employee-list.dto';

export interface IEmployeeQueryService {
  findEmployees(query: EmployeeQueryDto): Promise<PaginatedEmployeeListDto>;
  getEmployeeDetails(id: string): Promise<EmployeeDetailsDto>;
}
