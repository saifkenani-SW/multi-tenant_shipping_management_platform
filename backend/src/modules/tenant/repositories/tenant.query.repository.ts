import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB } from '../../../infrastructure/database/generated/kysely/types';
import { ITenantQueryRepository } from '../interfaces/tenant.query.repository.interface';
import { Cacheable } from '../../../core/cache/decorators/Cacheable';
import type { ICacheProvider } from '../../../core/cache/interfaces/ICacheProvider';
import {
  TENANT_CACHE_KEYS,
  TENANT_CACHE_TTL,
} from '../constants/tenant.cache.constants';
import { TenantSearchField } from '../enums/tenant-search-field.enum';
import { Tenant } from '../domain/tenant.entity';
import { TenantStatus } from '../enums/tenant-status.enum';

@Injectable()
export class TenantQueryRepository implements ITenantQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly kysely: Kysely<DB>,
    @Inject('ICacheProvider')
    public readonly cacheProvider: ICacheProvider,
  ) {}

  @Cacheable({
    ttl: TENANT_CACHE_TTL.LIST,
    keyBuilder: (
      skip: number,
      take: number,
      search?: string,
      searchType?: TenantSearchField,
    ) =>
      `${TENANT_CACHE_KEYS.LIST}:${skip}:${take}:${searchType || 'any'}:${search || 'all'}`,
  })
  async findMany(
    skip: number,
    take: number,
    search?: string,
    searchType?: TenantSearchField,
  ): Promise<[Tenant[], number]> {
    let query = this.kysely
      .selectFrom('tenant')
      .select([
        'id',
        'name',
        'is_active',
        'tax_number',
        'email',
        'created_at',
        'updated_at',
        'suspended_at',
        'suspended_reason',
      ]);
    let countQuery = this.kysely
      .selectFrom('tenant')
      .select((eb) => eb.fn.count('id').as('count'));

    if (search) {
      const field =
        searchType === TenantSearchField.TAX_NUMBER ? 'tax_number' : 'name';
      query = query.where(field, 'ilike', `%${search}%`);
      countQuery = countQuery.where(field, 'ilike', `%${search}%`);
    }

    query = query.orderBy('created_at', 'desc').offset(skip).limit(take);

    const [items, totalCountResult] = await Promise.all([
      query.execute(),
      countQuery.executeTakeFirst(),
    ]);

    const total = Number(totalCountResult?.count || 0);

    const mappedItems = items.map(
      (tenant) =>
        new Tenant(
          tenant.id,
          tenant.name,
          tenant.is_active ? TenantStatus.ACTIVE : TenantStatus.SUSPENDED,
          tenant.tax_number || '',
          tenant.email || '',
          tenant.created_at,
          tenant.updated_at,
          tenant.suspended_at,
          tenant.suspended_reason,
        ),
    );

    return [mappedItems, total];
  }

  @Cacheable({
    ttl: TENANT_CACHE_TTL.DETAILS,
    keyBuilder: (id: string) => `${TENANT_CACHE_KEYS.DETAILS}:${id}`,
  })
  async findById(id: string): Promise<Tenant | null> {
    const tenant = await this.kysely
      .selectFrom('tenant')
      .select([
        'id',
        'name',
        'is_active',
        'tax_number',
        'email',
        'created_at',
        'updated_at',
        'suspended_at',
        'suspended_reason',
      ])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!tenant) return null;

    return new Tenant(
      tenant.id,
      tenant.name,
      tenant.is_active ? TenantStatus.ACTIVE : TenantStatus.SUSPENDED,
      tenant.tax_number || '',
      tenant.email || '',
      tenant.created_at,
      tenant.updated_at,
      tenant.suspended_at,
      tenant.suspended_reason,
    );
  }
}
