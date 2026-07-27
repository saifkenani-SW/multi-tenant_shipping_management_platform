import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    example: 'sara@example.com',
    description: 'The email used during registration',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: '123456',
    description: 'The 6-digit OTP sent by email',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp!: string;
}
