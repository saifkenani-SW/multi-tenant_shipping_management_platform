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

  /**
   * The user account behind an employee.
   *
   * Notifications are addressed to users, not employees, so any module that
   * wants to reach an employee's phone has to cross that boundary here.
   * Returns null rather than throwing: the callers are advisory (a push), and
   * a missing employee must not fail the operation that triggered it.
   */
  async getUserId(id: string, tenantId?: string): Promise<string | null> {
    try {
      const employee = await this.queryService.findById(id, tenantId);
      return employee.userId;
    } catch {
      return null;
    }
  }
}
