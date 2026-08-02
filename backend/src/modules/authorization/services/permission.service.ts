import { Injectable } from '@nestjs/common';
import { Pagination } from '../../../common/pagination';
import { PermissionQueryDto } from '../dtos/requests/permission-query.dto';
import { PermissionDetailsDto } from '../dtos/responses/permission-details.dto';
import { PaginatedPermissionListDto } from '../dtos/responses/permission-list.dto';
import { PermissionNotFoundException } from '../exceptions/permission-not-found.exception';
import { PermissionResponseMapper } from '../mappers/response/permission.response.mapper';
import { PermissionRepository } from '../repositories/permission.repository';

@Injectable()
export class PermissionService {
  constructor(
    private readonly permissionRepository: PermissionRepository,
    private readonly permissionResponseMapper: PermissionResponseMapper,
  ) {}

  async findPermissions(
    query: PermissionQueryDto,
  ): Promise<PaginatedPermissionListDto> {
    const [items, total] = await this.permissionRepository.findMany(query);

    const pagination = new Pagination({
      page: query.page || 1,
      limit: query.limit || 10,
    });

    return this.permissionResponseMapper.toPaginatedListDto(
      items,
      total,
      pagination,
    );
  }

  async getPermissionDetails(id: string): Promise<PermissionDetailsDto> {
    const permission = await this.permissionRepository.findById(id);

    if (!permission) {
      throw new PermissionNotFoundException();
    }

    return this.permissionResponseMapper.toDetailsDto(permission);
  }
}
