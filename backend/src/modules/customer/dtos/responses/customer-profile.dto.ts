import { ApiProperty } from '@nestjs/swagger';

export class CustomerProfileDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  phone!: string;

  @ApiProperty()
  createdAt!: Date;
}
