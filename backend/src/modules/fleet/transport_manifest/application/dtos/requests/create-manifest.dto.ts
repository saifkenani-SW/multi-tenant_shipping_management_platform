import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateManifestDto {
  @ApiProperty({
    description: 'Organization unit the manifest is loaded at',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  originOrgUnitId: string;

  @ApiProperty({
    description: 'Organization unit the manifest is unloaded at',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  destinationOrgUnitId: string;
}
