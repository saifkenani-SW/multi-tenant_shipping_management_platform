import { ConflictException } from '@nestjs/common';

/**
 * الموقع مُسنَد إلى وحدات تنظيم عبر org_unit_location_mapping، والعلاقة
 * cascade — أي أن الحذف يسحب تغطية فروع قائمة بصمت.
 */
export class LocationInUseException extends ConflictException {
  constructor(mappingCount: number) {
    super(
      `Location is still mapped to ${mappingCount} organization unit(s). Remove those mappings first.`,
    );
  }
}
