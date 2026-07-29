import { Inject, Injectable } from '@nestjs/common';

import { Authorize } from '../../../packages/authorization';
import { Policy } from '../../../packages/authorization/policy';
import { ReturnVisibilityScope } from '../../../packages/authorization/decorators/return-visibility-scope.decorator';
import { PermissionQueryCriteriaBuilder } from '../builders/query/permission-query-criteria.builder';
import { PermissionQueryDto } from '../dtos/requests/permission-query.dto';
import { PermissionDetailsDto } from '../dtos/responses/permission-details.dto';
import { PaginatedPermissionListDto } from '../dtos/responses/permission-list.dto';
import { PermissionNotFoundException } from '../exceptions/permission-not-found.exception';
import { IPermissionQueryService } from '../interfaces/permission.query.service.interface';
import type { IPermissionQueryRepository } from '../interfaces/permission.query.repository.interface';
import { PermissionResponseMapper } from '../mappers/response/permission.response.mapper';
import { PERMISSION_QUERY_REPOSITORY_TOKEN } from '../tokens/permission-repository.tokens';
import {
  PermissionAction,
  PermissionPolicy,
  PermissionVisibilityScope,
} from '../authorization';

@Injectable()
export class PermissionQueryService implements IPermissionQueryService {
  constructor(
    @Inject(PERMISSION_QUERY_REPOSITORY_TOKEN)
    private readonly permissionQueryRepository: IPermissionQueryRepository,
    private readonly permissionQueryCriteriaBuilder: PermissionQueryCriteriaBuilder,
    private readonly permissionResponseMapper: PermissionResponseMapper,
  ) {}

  @ReturnVisibilityScope({
    builder: PermissionVisibilityScope,
  })
  @Authorize({
    policy: Policy(PermissionPolicy, PermissionAction.View),
  })
  async findPermissions(
    query: PermissionQueryDto,
  ): Promise<PaginatedPermissionListDto> {
    const criteria = this.permissionQueryCriteriaBuilder.build(query);

    const [items, total] =
      await this.permissionQueryRepository.findMany(criteria);

    return this.permissionResponseMapper.toPaginatedListDto(
      items,
      total,
      criteria.pagination,
    );
  }

  @Authorize({
    policy: Policy(PermissionPolicy, PermissionAction.View),
    payloadResolver: (permissionId: string) => ({
      permissionId,
    }),
  })
  async getPermissionDetails(id: string): Promise<PermissionDetailsDto> {
    const permission = await this.permissionQueryRepository.findById(id);

    if (!permission) {
      throw new PermissionNotFoundException();
    }

    return this.permissionResponseMapper.toDetailsDto(permission);
  }
}
