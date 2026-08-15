import { ForbiddenException, Injectable } from '@nestjs/common';

import { RequestContextService } from '../../../../packages/context/services/request-context.service';
import { SubjectType } from '../../../../packages/context/principal/principal/SubjectType';
import { CursorPaginatedResponse } from '../../../../common/pagination/cursor/responses/cursor-paginated-response';
import { UserListingQueryRepository } from '../../infrastructure/repositories/user-listing.query.repository';
import { UserQueryDto, UserAccountType } from '../dtos/requests/user-query.dto';
import { UserListItemDto } from '../dtos/responses/user-list-item.dto';

@Injectable()
export class UserListingQueryService {
  constructor(
    private readonly repository: UserListingQueryRepository,
    private readonly requestContext: RequestContextService,
  ) {}

  /**
   * Lists users the caller is allowed to see.
   *
   * The workspace boundary is decided here, from the request context, and is
   * never taken from the request. A tenant admin is pinned to their own
   * workspace; a `tenantId` in the query can only narrow a platform owner's
   * view, and a tenant admin asking for someone else's workspace is refused
   * rather than quietly given their own — silently changing what was asked for
   * would let them believe another workspace was empty.
   */
  async list(
    query: UserQueryDto,
  ): Promise<CursorPaginatedResponse<UserListItemDto>> {
    const principal = this.requestContext.getPrincipal();
    const isPlatformOwner =
      principal.subject.type === SubjectType.PLATFORM_OWNER;

    let tenantScope: string | null = null;

    if (!isPlatformOwner) {
      const callerTenantId = principal.tenantId;

      if (!callerTenantId) {
        throw new ForbiddenException(
          'This account is not attached to a workspace.',
        );
      }

      if (query.tenantId && query.tenantId !== callerTenantId) {
        throw new ForbiddenException(
          'You can only list users in your own workspace.',
        );
      }

      tenantScope = callerTenantId;
    } else if (query.tenantId) {
      tenantScope = query.tenantId;
    }

    const page = await this.repository.list({
      search: query.search,
      accountType: query.accountType,
      tenantScope,
      cursor: query.cursor,
      limit: query.limit,
    });

    return new CursorPaginatedResponse<UserListItemDto>(
      page.data.map((record) => ({
        id: record.id,
        email: record.email,
        phone: record.phone,
        fullName: record.full_name,
        accountTypes: record.account_types as UserAccountType[],
        tenantIds: record.tenant_ids,
        profileImageUrl: record.profile_image_key
          ? `/me/avatar/${record.id}`
          : null,
        createdAt: record.created_at,
      })),
      page.meta,
    );
  }
}
