import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB } from '../../../infrastructure/database/generated/kysely/types';
import { ICustomerQueryRepository } from '../interfaces/customer.query.repository.interface';
import { Cacheable } from '../../../infrastructure/cache/decorators/Cacheable';
import {
  CUSTOMER_CACHE_KEYS,
  CUSTOMER_CACHE_TTL,
} from '../constants/customer.cache.constants';
import { Customer } from '../domain/customer.entity';

@Injectable()
export class CustomerQueryRepository implements ICustomerQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly kysely: Kysely<DB>,
  ) {}

  @Cacheable({
    ttl: CUSTOMER_CACHE_TTL.PROFILE,
    keyBuilder: (userId: string) => [CUSTOMER_CACHE_KEYS.PROFILE, userId],
  })
  async findProfileByUserId(userId: string): Promise<Customer | null> {
    const row = await this.kysely
      .selectFrom('customer_profile')
      .innerJoin('users', 'users.id', 'customer_profile.user_id')
      .select([
        'customer_profile.id',
        'customer_profile.user_id',
        'users.email',
        'customer_profile.full_name',
        'customer_profile.phone',
        'customer_profile.profile_image_key',
        'customer_profile.created_at',
        'customer_profile.updated_at',
      ])
      .where('customer_profile.user_id', '=', userId)
      .executeTakeFirst();

    if (!row) return null;

    return new Customer(
      row.id,
      row.user_id,
      row.email,
      row.full_name,
      row.phone,
      row.profile_image_key,
      row.created_at,
      row.updated_at,
    );
  }

  async findProfileImageKeyById(profileId: string): Promise<string | null> {
    const row = await this.kysely
      .selectFrom('customer_profile')
      .select('profile_image_key')
      .where('id', '=', profileId)
      .executeTakeFirst();

    return row?.profile_image_key ?? null;
  }
}
