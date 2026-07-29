import { Injectable } from '@nestjs/common';

import { TransactionalPrismaService } from '../../../core/transaction';
import {
  CreateAssignmentRepositoryData,
  CreateEmployeeRepositoryData,
  CreateEmployeeUserData,
  UpdateEmployeeRepositoryData,
} from '../contracts/persistence/employee-repository-data.types';
import { IEmployeeCommandRepository } from '../interfaces/employee.command.repository.interface';

@Injectable()
export class EmployeeCommandRepository implements IEmployeeCommandRepository {
  constructor(private readonly prisma: TransactionalPrismaService) {}

  async createUser(data: CreateEmployeeUserData): Promise<string> {
    const user = await this.prisma.client.users.create({
      data: {
        email: data.email,
        phone: data.phone,
        password_hash: data.passwordHash,
      },
    });

    return user.id;
  }

  async create(data: CreateEmployeeRepositoryData): Promise<string> {
    const employee = await this.prisma.client.employee.create({
      data: {
        tenant_id: data.tenantId,
        user_id: data.userId,
        employee_code: data.employeeCode,
        full_name: data.fullName,
        national_id: data.nationalId,
      },
    });

    return employee.id;
  }

  async update(
    id: string,
    data: UpdateEmployeeRepositoryData,
  ): Promise<void> {
    await this.prisma.client.employee.update({
      where: { id },
      data: {
        full_name: data.fullName,
        national_id: data.nationalId,
        employee_code: data.employeeCode,
      },
    });
  }

  /**
   * deactivated_at يتبع is_active: صفّان يجب ألا يفترقا، وإلا صار
   * التاريخ يشير إلى تعطيل لم يعد قائماً.
   */
  async setActiveState(id: string, isActive: boolean): Promise<void> {
    await this.prisma.client.employee.update({
      where: { id },
      data: {
        is_active: isActive,
        deactivated_at: isActive ? null : new Date(),
      },
    });
  }

  async createAssignment(
    data: CreateAssignmentRepositoryData,
  ): Promise<string> {
    const assignment = await this.prisma.client.employee_assignment.create({
      data: {
        tenant_id: data.tenantId,
        employee_id: data.employeeId,
        organization_unit_id: data.organizationUnitId,
      },
    });

    if (data.roleIds.length > 0) {
      await this.prisma.client.assignment_role.createMany({
        data: data.roleIds.map((roleId) => ({
          assignment_id: assignment.id,
          role_id: roleId,
        })),
        skipDuplicates: true,
      });
    }

    return assignment.id;
  }

  async removeAssignment(assignmentId: string): Promise<void> {
    // assignment_role مرتبطة بـ cascade فتُحذف معها.
    await this.prisma.client.employee_assignment.delete({
      where: { id: assignmentId },
    });
  }

  /**
   * استبدال كامل. يجب أن يجري داخل @Transactional() وإلا تركنا التعيين
   * بلا أدوار إذا فشل الإدراج.
   */
  async setAssignmentRoles(
    assignmentId: string,
    roleIds: readonly string[],
  ): Promise<void> {
    await this.prisma.client.assignment_role.deleteMany({
      where: { assignment_id: assignmentId },
    });

    if (roleIds.length === 0) {
      return;
    }

    await this.prisma.client.assignment_role.createMany({
      data: roleIds.map((roleId) => ({
        assignment_id: assignmentId,
        role_id: roleId,
      })),
      skipDuplicates: true,
    });
  }
}
