import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { ITenantQueryRepository } from '../../application/interfaces/tenant.query.repository.interface';
import { Cacheable } from '../../../../infrastructure/cache/decorators/Cacheable';
import {
  TENANT_CACHE_KEYS,
  TENANT_CACHE_TTL,
} from '../../constants/tenant.cache.constants';
import { TenantSearchField } from '../../domain/enums/tenant-search-field.enum';
import { TenantStatus } from '../../domain/enums/tenant-status.enum';
import { SubscriptionStatus } from '@prisma/client';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantSubscription } from '../../domain/entities/tenant-subscription.entity';
import { TenantSubscriptionHistory } from '../../domain/entities/tenant-subscription-history.entity';
import type { TenantQueryCriteria } from '../../application/builders/query/tenant-query-criteria';
import { TenantPersistenceMapper } from '../mappers/tenant.persistence.mapper';
import { DB } from '../../../../infrastructure/database/generated/kysely/types';

@Injectable()
export class TenantQueryRepository implements ITenantQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly kysely: Kysely<DB>,
    private readonly tenantPersistenceMapper: TenantPersistenceMapper,
  ) {}

  @Cacheable({
    ttl: TENANT_CACHE_TTL.LIST,
    keyBuilder: (criteria: TenantQueryCriteria) => [
      TENANT_CACHE_KEYS.LIST,
      criteria.pagination.skip,
      criteria.pagination.take,
      criteria.search?.field ?? 'any',
      criteria.search?.keyword ?? 'all',
      criteria.tenantId ?? 'all',
      criteria.status ?? 'all',
    ],
  })
  async findMany(criteria: TenantQueryCriteria): Promise<[Tenant[], number]> {
    let query = this.kysely
      .selectFrom('tenant')
      .select([
        'id',
        'name',
        'is_active',
        'tax_number',
        'email',
        'phone',
        'logo_url',
        'created_at',
        'updated_at',
        'suspended_at',
        'suspended_reason',
      ]);
    let countQuery = this.kysely
      .selectFrom('tenant')
      .select((eb) => eb.fn.count('id').as('count'));

    if (criteria.search) {
      const field =
        criteria.search.field === TenantSearchField.TAX_NUMBER
          ? 'tax_number'
          : 'name';
      query = query.where(field, 'ilike', `%${criteria.search.keyword}%`);
      countQuery = countQuery.where(
        field,
        'ilike',
        `%${criteria.search.keyword}%`,
      );
    }

    if (criteria.status) {
      const isActive = criteria.status === TenantStatus.ACTIVE;
      query = query.where('is_active', '=', isActive);
      countQuery = countQuery.where('is_active', '=', isActive);
    }

    if (criteria.tenantId) {
      query = query.where('id', '=', criteria.tenantId);
      countQuery = countQuery.where('id', '=', criteria.tenantId);
    }

    query = query
      .orderBy('created_at', 'desc')
      .offset(criteria.pagination.skip)
      .limit(criteria.pagination.take);

    const [items, totalCountResult] = await Promise.all([
      query.execute(),
      countQuery.executeTakeFirst(),
    ]);

    const total = Number(totalCountResult?.count || 0);

    const mappedItems = items.map((record) =>
      this.tenantPersistenceMapper.toDomain(record as any),
    );

    return [mappedItems, total];
  }

  @Cacheable({
    ttl: TENANT_CACHE_TTL.DETAILS,
    keyBuilder: (id: string) => [TENANT_CACHE_KEYS.DETAILS, id],
  })
  async findById(id: string): Promise<Tenant | null> {
    const record = await this.kysely
      .selectFrom('tenant')
      .select([
        'id',
        'name',
        'is_active',
        'tax_number',
        'email',
        'phone',
        'logo_url',
        'created_at',
        'updated_at',
        'suspended_at',
        'suspended_reason',
      ])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!record) return null;

    return this.tenantPersistenceMapper.toDomain(record as any);
  }

  async findActiveSubscription(
    tenantId: string,
  ): Promise<TenantSubscription | null> {
    const record = await this.kysely
      .selectFrom('tenant_subscription')
      .selectAll()
      .where('tenant_id', '=', tenantId)
      .where('status', '=', SubscriptionStatus.ACTIVE)
      .orderBy('created_at', 'desc')
      .executeTakeFirst();

    if (!record) return null;
    return this.tenantPersistenceMapper.toSubscriptionDomain(record as any);
  }

  async findSubscriptionHistory(
    tenantId: string,
  ): Promise<TenantSubscriptionHistory[]> {
    const records = await this.kysely
      .selectFrom('tenant_subscription_history')
      .selectAll()
      .where('tenant_id', '=', tenantId)
      .orderBy('performed_at', 'desc')
      .execute();

    return records.map((record) =>
      this.tenantPersistenceMapper.toSubscriptionHistoryDomain(record as any),
    );
  }
}
