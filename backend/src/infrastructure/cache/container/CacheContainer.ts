import { ModuleRef } from '@nestjs/core';

export class CacheContainer {
  private static moduleRef: ModuleRef;

  static setModuleRef(moduleRef: ModuleRef): void {
    this.moduleRef = moduleRef;
  }

  static get<T>(token: string | symbol | Function): T {
    if (!this.moduleRef) {
      throw new Error(
        'CacheContainer has not been initialized. Did you import CacheModule?',
      );
    }

    return this.moduleRef.get<T>(token, {
      strict: false,
    });
  }
}
