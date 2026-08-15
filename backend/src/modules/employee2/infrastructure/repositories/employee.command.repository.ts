import { Injectable } from '@nestjs/common';
import { TransactionalPrismaService } from '../../../../packages/transaction/services/transactional-prisma.service';
import { CreateEmployeeDto } from '../../application/dtos/requests/create-employee.dto';
import { UpdateEmployeeDto } from '../../application/dtos/requests/update-employee.dto';

@Injectable()
export class EmployeeCommandRepository {
  constructor(private readonly prisma: TransactionalPrismaService) {}

  async create(tenantId: string, dto: CreateEmployeeDto) {
    return this.prisma.client.employee.create({
      data: {
        tenant_id: tenantId,
        user_id: dto.userId as string,
        employee_code: dto.employeeCode,
        full_name: dto.fullName,
        national_id: dto.nationalId,
      },
      select: { id: true },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateEmployeeDto) {
    return this.prisma.client.employee.update({
      where: { id },
      data: {
        employee_code: dto.employeeCode,
        full_name: dto.fullName,
        national_id: dto.nationalId,
      },
      select: { id: true },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.prisma.client.employee.delete({
      where: { id },
    });
    return { id };
  }

  async addAssignments(
    tenantId: string,
    employeeId: string,
    assignments: { organizationUnitId: string; roleIds: string[] }[],
  ) {
    for (const assignment of assignments) {
      const createdAssignment =
        await this.prisma.client.employee_assignment.create({
          data: {
            tenant_id: tenantId,
            employee_id: employeeId,
            organization_unit_id: assignment.organizationUnitId,
          },
        });

      if (assignment.roleIds.length > 0) {
        const rolesData = assignment.roleIds.map((roleId) => ({
          assignment_id: createdAssignment.id,
          role_id: roleId,
        }));
        await this.prisma.client.assignment_role.createMany({
          data: rolesData,
          skipDuplicates: true,
        });
      }
    }

    return { id: employeeId };
  }

  async activate(id: string) {
    return this.prisma.client.employee.update({
      where: { id },
      data: {
        is_active: true,
        deactivated_at: null,
      },
    });
  }

  async deactivate(id: string) {
    return this.prisma.client.employee.update({
      where: { id },
      data: {
        is_active: false,
        deactivated_at: new Date(),
      },
    });
  }

  async removeAssignment(id: string, assignmentId: string) {
    return this.prisma.client.employee_assignment.deleteMany({
      where: {
        id: assignmentId,
        employee_id: id,
      },
    });
  }

  async setAssignmentRoles(assignmentId: string, roleIds: string[]) {
    await this.prisma.client.assignment_role.deleteMany({
      where: { assignment_id: assignmentId },
    });

    if (roleIds.length > 0) {
      await this.prisma.client.assignment_role.createMany({
        data: roleIds.map((roleId) => ({
          assignment_id: assignmentId,
          role_id: roleId,
        })),
        skipDuplicates: true,
      });
    }
  }
}
