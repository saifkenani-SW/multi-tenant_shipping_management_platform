import { Customer } from '../domain/customer.entity';

export interface ICustomerQueryRepository {
  findProfileByUserId(userId: string): Promise<Customer | null>;
  findProfileImageKeyById(profileId: string): Promise<string | null>;
  /**
   * Existence check by customer PROFILE id — the identifier other aggregates
   * store, as opposed to the login user id used by findProfileByUserId.
   */
  existsByProfileId(profileId: string): Promise<boolean>;
}
