import { Inject, Injectable } from '@nestjs/common';
import type { ICustomerQueryRepository } from '../interfaces/customer.query.repository.interface';

/**
 * Public entry point into the Customer module.
 *
 * Other modules must not reach the customer services or repositories directly.
 * Note the identifier: this answers questions about a customer PROFILE id,
 * which is what other aggregates store, not the login user id that
 * ICustomerQueryService.getProfile expects.
 */
@Injectable()
export class CustomerFacade {
  constructor(
    @Inject('ICustomerQueryRepository')
    private readonly queryRepository: ICustomerQueryRepository,
  ) {}

  /**
   * Whether a customer profile exists. Returns false instead of throwing so
   * callers can treat it as a check.
   */
  async exists(customerProfileId: string): Promise<boolean> {
    try {
      return await this.queryRepository.existsByProfileId(customerProfileId);
    } catch {
      return false;
    }
  }
}
