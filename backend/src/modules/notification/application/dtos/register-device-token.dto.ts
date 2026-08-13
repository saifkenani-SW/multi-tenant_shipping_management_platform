import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDeviceTokenDto {
  @ApiProperty({
    description: 'FCM Device Token من Firebase',
    example: 'fGH8kq3...',
  })
  @IsString()
  @IsNotEmpty()
  fcmToken: string;

  @ApiProperty({
    description: 'نوع الجهاز',
    enum: ['android', 'ios', 'web'],
    example: 'android',
  })
  @IsString()
  @IsIn(['android', 'ios', 'web'])
  platform: string;
}
