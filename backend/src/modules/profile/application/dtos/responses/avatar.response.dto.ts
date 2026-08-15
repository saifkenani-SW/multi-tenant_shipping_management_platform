import { ApiProperty } from '@nestjs/swagger';

export class AvatarResponseDto {
  @ApiProperty({
    description: 'Path to fetch the image from',
    example: '/me/avatar/01910b80-6e42-7000-8000-000000000013',
  })
  profileImageUrl: string;
}
