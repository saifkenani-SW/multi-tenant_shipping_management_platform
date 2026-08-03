import { ApiProperty } from '@nestjs/swagger';

export class UploadProfileImageResponseDto {
  @ApiProperty({
    example:
      '/customer/profile-image/0198f7d2-9b6c-7000-8000-000000000001?v=1785709800000',
  })
  profileImageUrl!: string;
}
