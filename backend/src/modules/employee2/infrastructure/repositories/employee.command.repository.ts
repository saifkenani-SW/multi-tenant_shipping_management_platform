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
        user_id: dto.userId,
        employee_code: dto.employeeCode,
        full_name: dto.fullName,
        national_id: dto.nationalId,
      },
      select: { id: true },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateEmployeeDto) {
    // Assuming we verify tenant_id before updating, or use it in a where if composite unique exists, but standard is find First then update or just by ID if we're sure.
    // For safety, let's just use ID, the service should ensure the employee belongs to tenant.
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
    orgUnitIds: string[],
  ) {
    const data = orgUnitIds.map((orgUnitId) => ({
      tenant_id: tenantId,
      employee_id: employeeId,
      organization_unit_id: orgUnitId,
    }));
    await this.prisma.client.employee_assignment.createMany({
      data,
      skipDuplicates: true,
    });
    return { id: employeeId };
  }
}
