import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'owner@logisticsplatform.com',
    description: 'The email of the user',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'password123',
    minLength: 6,
    description: 'The password of the user',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
