import { SetMetadata } from '@nestjs/common';

export const CASL_CONTRIBUTOR_METADATA = Symbol('CASL_CONTRIBUTOR_METADATA');

export const CaslContributor = (): ClassDecorator =>
  SetMetadata(CASL_CONTRIBUTOR_METADATA, true);
