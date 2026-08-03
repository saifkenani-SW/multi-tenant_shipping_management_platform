import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { extname } from 'path';
import type { ICustomerQueryRepository } from '../interfaces/customer.query.repository.interface';
import type {
  CustomerProfileImage,
  ICustomerQueryService,
} from '../interfaces/customer.query.service.interface';
import { CustomerProfileDto } from '../dtos/responses/customer-profile.dto';
import type { IStorageProvider } from '../../../packages/storage/src/contracts/storage-provider.interface';
import { STORAGE_PROVIDER } from '../../../packages/storage/src/constants/storage.constants';
import { buildCustomerProfileImageUrl } from '../constants/customer.cache.constants';

const IMAGE_CONTENT_TYPES: Readonly<Record<string, string>> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

@Injectable()
export class CustomerQueryService implements ICustomerQueryService {
  constructor(
    @Inject('ICustomerQueryRepository')
    private readonly customerQueryRepository: ICustomerQueryRepository,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {}

  async getProfile(userId: string): Promise<CustomerProfileDto | null> {
    const customer =
      await this.customerQueryRepository.findProfileByUserId(userId);

    if (!customer) return null;

    const dto = new CustomerProfileDto();
    dto.id = customer.id;
    dto.email = customer.email;
    dto.fullName = customer.fullName;
    dto.phone = customer.phone;
    dto.profileImageUrl = customer.profileImageKey
      ? buildCustomerProfileImageUrl(customer.id, customer.updatedAt)
      : null;
    dto.createdAt = customer.createdAt;

    return dto;
  }

  async getProfileImage(profileId: string): Promise<CustomerProfileImage> {
    const storageKey =
      await this.customerQueryRepository.findProfileImageKeyById(profileId);

    if (!storageKey) {
      throw new NotFoundException('Customer profile image not found');
    }

    const extension = extname(storageKey).toLowerCase();

    return {
      stream: await this.storageProvider.get(storageKey),
      contentType: IMAGE_CONTENT_TYPES[extension] ?? 'application/octet-stream',
    };
  }
}
