import { Injectable } from '@nestjs/common';
import { ICacheKeyBuilder } from '../../../core/cache/interfaces/ICacheKeyBuilder';

@Injectable()
export class CacheKeyBuilder implements ICacheKeyBuilder {
  build(parts: readonly unknown[]): string {
    return parts
      .map((part) => {
        if (part === undefined) return 'undefined';
        if (part === null) return 'null';
        if (typeof part === 'object') return JSON.stringify(part);

        return String(part);
      })
      .join(':');
  }
}
