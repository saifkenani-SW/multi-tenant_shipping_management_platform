import { CreateEmployeeDto } from '../../../dtos/requests/create-employee.dto';
import { UpdateEmployeeDto } from '../../../dtos/requests/update-employee.dto';

export interface CreateEmployeePayload {
  dto: CreateEmployeeDto;
}

export interface ViewEmployeePayload {
  employeeId?: string;
}

export interface UpdateEmployeePayload {
  employeeId: string;
  dto: UpdateEmployeeDto;
}

export interface ChangeEmployeeStatusPayload {
  employeeId: string;
}

export interface ManageAssignmentsPayload {
  employeeId: string;
}
