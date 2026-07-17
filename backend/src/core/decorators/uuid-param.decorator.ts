import { Param, ParseUUIDPipe } from '@nestjs/common';

/**
 * Custom parameter decorator to extract and validate a UUID v7 parameter from the route.
 * 
 * @param property The name of the route parameter to extract. Defaults to 'id'.
 */
export const UUIDParam = (property: string = 'id') => {
  return Param(property, new ParseUUIDPipe({ version: '7' }));
};
