import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { UserAccountType } from '../requests/user-query.dto';

export class UserListItemDto {
  @ApiProperty({ description: 'Login account id' })
  id: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional({ nullable: true })
  phone?: string | null;

  @ApiPropertyOptional({
    description:
      'Name from the profile behind this account. Null when the account has no profile yet.',
    nullable: true,
  })
  fullName?: string | null;

  @ApiProperty({
    enum: UserAccountType,
    isArray: true,
    description:
      'Every kind of account this user holds. One person can be both an employee and a customer, so this is a list.',
  })
  accountTypes: UserAccountType[];

  @ApiPropertyOptional({
    description:
      'Workspaces this user belongs to. Always exactly the caller workspace for a tenant admin; empty for a platform admin, who belongs to none.',
    type: [String],
  })
  tenantIds: string[];

  @ApiPropertyOptional({
    description: 'Path to the avatar, or null when none is set',
    nullable: true,
  })
  profileImageUrl?: string | null;

  @ApiProperty()
  createdAt: Date;
}
