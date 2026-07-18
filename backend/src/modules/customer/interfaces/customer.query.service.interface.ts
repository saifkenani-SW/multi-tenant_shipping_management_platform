import { CustomerProfileDto } from '../dtos/responses/customer-profile.dto';

export interface ICustomerQueryService {
  getProfile(userId: string): Promise<CustomerProfileDto | null>;
}
