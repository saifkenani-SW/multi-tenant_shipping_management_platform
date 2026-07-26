import { Type } from '@nestjs/common';

import { VisibilityScopeBuilder } from './visibility-scope-builder.interface';

export interface ScopeOptions<TScope = unknown> {
  readonly builder: Type<VisibilityScopeBuilder<TScope>>;
}
