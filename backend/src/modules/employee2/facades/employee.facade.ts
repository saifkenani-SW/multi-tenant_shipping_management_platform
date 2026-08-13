import { Injectable } from '@nestjs/common';
import { EmployeeQueryService } from '../application/services/employee.query.service';

@Injectable()
export class EmployeeFacade {
  constructor(private readonly queryService: EmployeeQueryService) {}

  async validateEmployeeExists(
    id: string,
    tenantId?: string,
  ): Promise<boolean> {
    try {
      const employee = await this.queryService.findById(id, tenantId);
      return !!employee;
    } catch {
      return false;
    }
  }

  async getEmployeeName(id: string): Promise<string> {
    try {
      const employee = await this.queryService.findById(id);
      return employee.fullName;
    } catch {
      return 'Unknown';
    }
  }
}
