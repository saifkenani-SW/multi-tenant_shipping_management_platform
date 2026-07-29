import { BadRequestException } from '@nestjs/common';

import { LocationType } from '../enums/location-type.enum';

/**
 * الهرم يجب أن ينزل مستوى واحداً: مدينة تحت محافظة، لا مدينة تحت حي
 * ولا مدينة تحت دولة مباشرة.
 */
export class InvalidLocationHierarchyException extends BadRequestException {
  constructor(childType: LocationType, parentType: LocationType | null) {
    super(
      parentType === null
        ? `A ${childType} must have a parent location`
        : `A ${childType} cannot be placed under a ${parentType}`,
    );
  }
}
