import { Injectable, NotFoundException } from '@nestjs/common';
import { EmployeeQueryRepository } from '../../infrastructure/repositories/employee.query.repository';
import { EmployeeQueryDto } from '../dtos/requests/employee-query.dto';
import { PaginatedResponse } from '../../../../common/pagination/offset/responses/paginated-response';
import { PaginationMeta } from '../../../../common/pagination/offset/responses/pagination-meta';
import { Pagination } from '../../../../common/pagination/offset/value-objects/pagination';

@Injectable()
export class EmployeeQueryService {
  constructor(private readonly queryRepository: EmployeeQueryRepository) {}

  async findById(id: string, tenantId?: string) {
    const employee = await this.queryRepository.findById(id);
    if (!employee || (tenantId && employee.tenantId !== tenantId)) {
      throw new NotFoundException('الموظف غير موجود');
    }
    return employee;
  }

  async findMany(query: EmployeeQueryDto, contextTenantId?: string) {
    const limit = query.limit || 10;
    const page = query.page || 1;
    const offset = (page - 1) * limit;

    const effectiveTenantId = contextTenantId || query.tenantId;
    const items = await this.queryRepository.findMany(
      limit,
      offset,
      query.search,
      effectiveTenantId,
    );
    const total = await this.queryRepository.countByTenantId(effectiveTenantId); // optionally filter by search for accurate count

    return new PaginatedResponse(
      items,
      new PaginationMeta(new Pagination({ page, limit }), total),
    );
  }

  async countByTenantId(tenantId?: string) {
    return this.queryRepository.countByTenantId(tenantId);
  }
}
