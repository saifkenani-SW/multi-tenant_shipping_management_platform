import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { ITenantQueryRepository } from '../interfaces/tenant.query.repository.interface';
import { Cacheable } from '../../../core/cache/decorators/Cacheable';
import type { ICacheProvider } from '../../../core/cache/interfaces/ICacheProvider';
import {
  TENANT_CACHE_KEYS,
  TENANT_CACHE_TTL,
} from '../constants/tenant.cache.constants';
import { TenantSearchField } from '../dtos/tenant-query.dto';

@Injectable()
export class TenantQueryRepository implements ITenantQueryRepository {
  constructor(
    private readonly prisma: PrismaService,
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
  ): Promise<[any[], number]> {
    let whereClause = {};

    if (search) {
      const field =
        searchType === TenantSearchField.TAX_NUMBER
          ? TenantSearchField.TAX_NUMBER
          : TenantSearchField.NAME;
      whereClause = {
        [field]: { contains: search, mode: 'insensitive' as const },
      };
    }

    return Promise.all([
      this.prisma.tenant.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.tenant.count({ where: whereClause }),
    ]);
  }

  @Cacheable({
    ttl: TENANT_CACHE_TTL.DETAILS,
    keyBuilder: (id: string) => `${TENANT_CACHE_KEYS.DETAILS}:${id}`,
  })
  async findById(id: string): Promise<any | null> {
    return this.prisma.tenant.findUnique({
      where: { id },
    });
  }
}
