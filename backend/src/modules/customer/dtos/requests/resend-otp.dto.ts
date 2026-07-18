import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendOtpDto {
  @ApiProperty({
    example: 'sara@example.com',
    description: 'The email of the pending registration',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
