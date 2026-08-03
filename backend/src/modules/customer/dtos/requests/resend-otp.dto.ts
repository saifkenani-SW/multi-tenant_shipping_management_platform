import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendOtpDto {
  @ApiProperty({
    example: 'sara@example.com',
    description:
      'The email with an active registration or password-reset OTP request',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
