import { AssignEmployeeDto } from '../dtos/requests/assign-employee.dto';
import { CreateEmployeeDto } from '../dtos/requests/create-employee.dto';
import { SetAssignmentRolesDto } from '../dtos/requests/set-assignment-roles.dto';
import { UpdateEmployeeDto } from '../dtos/requests/update-employee.dto';

export interface IEmployeeCommandService {
  createEmployee(dto: CreateEmployeeDto): Promise<string>;
  updateEmployee(id: string, dto: UpdateEmployeeDto): Promise<void>;
  deactivateEmployee(id: string): Promise<void>;
  activateEmployee(id: string): Promise<void>;

  assignEmployee(id: string, dto: AssignEmployeeDto): Promise<string>;
  removeAssignment(id: string, assignmentId: string): Promise<void>;
  setAssignmentRoles(
    id: string,
    assignmentId: string,
    dto: SetAssignmentRolesDto,
  ): Promise<void>;
}
