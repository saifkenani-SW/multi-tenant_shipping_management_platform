import { Customer } from '../domain/customer.entity';

export interface ICustomerQueryRepository {
  findProfileByUserId(userId: string): Promise<Customer | null>;
  findProfileImageKeyById(profileId: string): Promise<string | null>;
}
