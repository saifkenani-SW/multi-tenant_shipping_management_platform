import { CustomerProfileDto } from '../dtos/responses/customer-profile.dto';
import type { Readable } from 'stream';

export interface CustomerProfileImage {
  stream: Readable;
  contentType: string;
}

export interface ICustomerQueryService {
  getProfile(userId: string): Promise<CustomerProfileDto | null>;
  getProfileImage(profileId: string): Promise<CustomerProfileImage>;
}
