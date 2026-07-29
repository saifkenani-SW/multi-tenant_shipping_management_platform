import { ConflictException } from '@nestjs/common';

/**
 * حذف موقع له أبناء يتركهم يتيمين: المفتاح الأجنبي على parent_id ليس
 * cascade، فالحذف يفشل على مستوى قاعدة البيانات برسالة غامضة.
 */
export class LocationHasChildrenException extends ConflictException {
  constructor(childCount: number) {
    super(
      `Location still has ${childCount} child location(s). Delete or move them first.`,
    );
  }
}
