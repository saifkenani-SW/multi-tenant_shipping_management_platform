import { Type } from '@nestjs/common';
import { CapabilityBuilder } from './capability-builder.interface';

export interface CapabilitiesOptions<TEntity, TCapability> {
  readonly policy: Type<CapabilityBuilder<TEntity, TCapability>>;
}
