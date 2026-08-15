import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class AssignManifestsDto {
  @ApiProperty({
    description: 'IDs of READY_FOR_DISPATCH manifests to assign to this trip',
    type: [String],
    format: 'uuid',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  manifestIds: string[];
}
