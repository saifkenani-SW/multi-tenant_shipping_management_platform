import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

/** استبدال كامل: القائمة المرسلة تصبح تغطية الوحدة. */
export class SetCoverageDto {
  @ApiProperty({
    description: 'The full set of global location ids the unit covers',
    type: [String],
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  locationIds: string[];
}
