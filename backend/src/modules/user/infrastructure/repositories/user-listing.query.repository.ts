import { Inject, Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';

import { DB } from '../../../../infrastructure/database/generated/kysely/types';
import { CursorPaginatedResponse } from '../../../../common/pagination/cursor/responses/cursor-paginated-response';
import { UserAccountType } from '../../application/dtos/requests/user-query.dto';

export interface UserListingCriteria {
  search?: string;
  accountType?: UserAccountType;

  /**
   * The workspaces this listing is allowed to reach.
   *
   * `null` means unrestricted and is only ever set for a platform owner. A
   * tenant admin always arrives here with their own id, resolved from the
   * request context rather than from anything the caller sent.
   */
  tenantScope: string | null;

  cursor?: string;
  limit: number;
}

export interface UserListingRecord {
  id: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  profile_image_key: string | null;
  account_types: string[];
  tenant_ids: string[];
  created_at: Date;
}

@Injectable()
export class UserListingQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly db: Kysely<DB>,
  ) {}

  /**
   * Lists users with the profile facts a directory screen needs.
   *
   * A user has no name of their own — names live on the profile rows — and one
   * person can hold several profiles at once, an employee who is also a
   * customer being the ordinary case. So name, account types and workspaces are
   * all gathered from those rows and folded into one row per user.
   */
  async list(
    criteria: UserListingCriteria,
  ): Promise<CursorPaginatedResponse<UserListingRecord>> {
    const { search, accountType, tenantScope, cursor, limit } = criteria;

    // Names, account kinds and workspace membership per user, gathered from
    // every profile table in one pass so the outer query stays a single scan.
    const profiles = this.db
      .selectFrom('users as u')
      .leftJoin('employee as e', 'e.user_id', 'u.id')
      .leftJoin('platform_admin as pa', 'pa.user_id', 'u.id')
      .leftJoin('tenant_owner as to2', 'to2.user_id', 'u.id')
      .leftJoin('customer_profile as cp', 'cp.user_id', 'u.id')
      .leftJoin('customer_tenant as ct', 'ct.customer_profile_id', 'cp.id')
      .select([
        'u.id as id',
        'u.email as email',
        'u.phone as phone',
        'u.profile_image_key as profile_image_key',
        'u.created_at as created_at',
        // First non-null name wins. They agree in practice; when they do not,
        // a listing is not the place to resolve it.
        sql<string | null>`COALESCE(MAX(e.full_name), MAX(pa.full_name), MAX(cp.full_name))`.as(
          'full_name',
        ),
        sql<string[]>`ARRAY_REMOVE(ARRAY[
          CASE WHEN COUNT(pa.id)  > 0 THEN 'PLATFORM_ADMIN' END,
          CASE WHEN COUNT(to2.id) > 0 THEN 'TENANT_OWNER'   END,
          CASE WHEN COUNT(e.id)   > 0 THEN 'EMPLOYEE'       END,
          CASE WHEN COUNT(cp.id)  > 0 THEN 'CUSTOMER'       END
        ], NULL)`.as('account_types'),
        sql<string[]>`COALESCE(
          ARRAY(
            SELECT DISTINCT t FROM UNNEST(
              ARRAY_AGG(e.tenant_id) || ARRAY_AGG(to2.tenant_id) || ARRAY_AGG(ct.tenant_id)
            ) AS t WHERE t IS NOT NULL
          ),
          ARRAY[]::uuid[]
        )`.as('tenant_ids'),
      ])
      .groupBy(['u.id', 'u.email', 'u.phone', 'u.profile_image_key', 'u.created_at'])
      .as('p');

    let query = this.db.selectFrom(profiles).selectAll();

    // The workspace boundary. A tenant admin never sees a user who has no tie
    // to their workspace, and never sees a platform admin, who belongs to no
    // workspace at all and is not theirs to administer.
    if (tenantScope) {
      query = query.where(
        sql<boolean>`${sql.ref('p.tenant_ids')} @> ARRAY[${sql.lit(tenantScope)}]::uuid[]`,
      );
      query = query.where(
        sql<boolean>`NOT (${sql.ref('p.account_types')} @> ARRAY['PLATFORM_ADMIN'])`,
      );
    }

    if (search) {
      const pattern = `%${search}%`;
      query = query.where(({ eb, or }) =>
        or([
          eb(sql.ref('p.full_name'), 'ilike', pattern),
          eb(sql.ref('p.email'), 'ilike', pattern),
        ]),
      );
    }

    if (accountType) {
      query = query.where(
        sql<boolean>`${sql.ref('p.account_types')} @> ARRAY[${sql.lit(accountType)}]`,
      );
    }

    // uuid v7 sorts by creation time, so ordering by id gives a stable newest
    // first page without a second sort column to carry in the cursor.
    if (cursor) {
      query = query.where(sql.ref('p.id'), '<', cursor);
    }

    const rows = (await query
      .orderBy(sql.ref('p.id'), 'desc')
      .limit(limit + 1)
      .execute()) as unknown as UserListingRecord[];

    const hasNextPage = rows.length > limit;
    const records = hasNextPage ? rows.slice(0, limit) : rows;

    return new CursorPaginatedResponse<UserListingRecord>(records, {
      hasNextPage,
      hasPreviousPage: !!cursor,
      nextCursor: hasNextPage ? records[records.length - 1].id : null,
      previousCursor: null,
    });
  }
}
