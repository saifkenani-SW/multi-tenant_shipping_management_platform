import { Inject, Injectable } from '@nestjs/common';
import type { ICustomerQueryRepository } from '../interfaces/customer.query.repository.interface';
import { ICustomerQueryService } from '../interfaces/customer.query.service.interface';
import { CustomerProfileDto } from '../dtos/responses/customer-profile.dto';

@Injectable()
export class CustomerQueryService implements ICustomerQueryService {
  constructor(
    @Inject('ICustomerQueryRepository')
    private readonly customerQueryRepository: ICustomerQueryRepository,
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
    dto.createdAt = customer.createdAt;

    return dto;
  }
}
