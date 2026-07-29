import {
  CreateAssignmentRepositoryData,
  CreateEmployeeRepositoryData,
  CreateEmployeeUserData,
  UpdateEmployeeRepositoryData,
} from '../contracts/persistence/employee-repository-data.types';

export interface IEmployeeCommandRepository {
  /** ينشئ سجل users ويرجّع معرّفه. */
  createUser(data: CreateEmployeeUserData): Promise<string>;

  create(data: CreateEmployeeRepositoryData): Promise<string>;
  update(id: string, data: UpdateEmployeeRepositoryData): Promise<void>;

  setActiveState(id: string, isActive: boolean): Promise<void>;

  createAssignment(data: CreateAssignmentRepositoryData): Promise<string>;
  removeAssignment(assignmentId: string): Promise<void>;

  /** استبدال كامل لأدوار تعيين واحد. */
  setAssignmentRoles(
    assignmentId: string,
    roleIds: readonly string[],
  ): Promise<void>;
}
