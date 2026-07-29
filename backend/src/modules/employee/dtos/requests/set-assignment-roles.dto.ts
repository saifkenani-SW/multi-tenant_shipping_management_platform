import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

/** استبدال كامل: القائمة المرسلة تصبح أدوار هذا التعيين. */
export class SetAssignmentRolesDto {
  @ApiProperty({
    description: 'The full set of role ids for this assignment',
    type: [String],
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  roleIds: string[];
}
