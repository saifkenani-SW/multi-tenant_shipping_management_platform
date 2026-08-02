import { Injectable } from '@nestjs/common';
import { UserQueryService } from '../services/user.query.service';

export interface UserSummaryDto {
  id: string;
  email: string;
  phone: string | null;
  isActive: boolean;
}

@Injectable()
export class UserFacade {
  constructor(private readonly queryService: UserQueryService) {}

  /**
   * Checks if a user exists and is active.
   */
  async existsAndActive(userId: string): Promise<boolean> {
    return this.queryService.existsAndActive(userId);
  }

  /**
   * Retrieves basic user summary for inter-module integration.
   */
  async getUserSummary(userId: string): Promise<UserSummaryDto | null> {
    return this.queryService.getUserSummary(userId);
  }

  /**
   * Retrieves full user identity for authentication.
   */
  async getIdentityByEmail(email: string) {
    return this.queryService.getIdentityByEmail(email);
  }
}
