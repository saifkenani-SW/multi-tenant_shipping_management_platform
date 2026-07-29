import { Inject, Injectable } from '@nestjs/common';

import {
  AuthorizationFacade,
  Authorize,
  ReturnCapabilities,
} from '../../../packages/authorization';
import { ReturnVisibilityScope } from '../../../packages/authorization/decorators/return-visibility-scope.decorator';
import { Policy } from '../../../packages/authorization/policy';
import {
  RoleAction,
  RoleCapabilityBuilder,
  RolePolicy,
  RoleVisibilityScope,
} from '../authorization';
import { RoleQueryCriteriaBuilder } from '../builders/query/role-query-criteria.builder';
import { RoleQueryDto } from '../dtos/requests/role-query.dto';
import { RoleDetailsDto } from '../dtos/responses/role-details.dto';
import { PaginatedRoleListDto } from '../dtos/responses/role-list.dto';
import { RoleNotFoundException } from '../exceptions/role-not-found.exception';
import type { IRoleQueryRepository } from '../interfaces/role.query.repository.interface';
import { IRoleQueryService } from '../interfaces/role.query.service.interface';
import { RoleResponseMapper } from '../mappers/response/role.response.mapper';
import { ROLE_QUERY_REPOSITORY_TOKEN } from '../tokens/role-repository.tokens';

@Injectable()
export class RoleQueryService implements IRoleQueryService {
  constructor(
    @Inject(ROLE_QUERY_REPOSITORY_TOKEN)
    private readonly roleQueryRepository: IRoleQueryRepository,
    private readonly authorizationFacade: AuthorizationFacade,
    private readonly roleQueryCriteriaBuilder: RoleQueryCriteriaBuilder,
    private readonly roleResponseMapper: RoleResponseMapper,
  ) {}

  @ReturnVisibilityScope({
    builder: RoleVisibilityScope,
  })
  @Authorize({
    policy: Policy(RolePolicy, RoleAction.View),
  })
  async findRoles(query: RoleQueryDto): Promise<PaginatedRoleListDto> {
    const scope = this.authorizationFacade.buildScope({
      builder: RoleVisibilityScope,
    });

    const criteria = this.roleQueryCriteriaBuilder.build(query, scope);

    const [items, total] = await this.roleQueryRepository.findMany(criteria);

    return this.roleResponseMapper.toPaginatedListDto(
      items,
      total,
      criteria.pagination,
    );
  }

  @ReturnCapabilities({
    policy: RoleCapabilityBuilder,
  })
  @Authorize({
    policy: Policy(RolePolicy, RoleAction.View),
    payloadResolver: (roleId: string) => ({ roleId }),
  })
  async getRoleDetails(id: string): Promise<RoleDetailsDto> {
    const role = await this.roleQueryRepository.findByIdWithPermissions(id);

    if (!role) {
      throw new RoleNotFoundException();
    }

    return this.roleResponseMapper.toDetailsDto(role);
  }
}
