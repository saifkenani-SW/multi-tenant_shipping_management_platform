import { INestApplicationContext, Type } from '@nestjs/common';

export class TransactionContainer {
  private static app: INestApplicationContext;

  static setApp(app: INestApplicationContext): void {
    this.app = app;
  }

  static get<T>(type: Type<T> | string | symbol): T {
    if (!this.app) {
      throw new Error(
        'TransactionContainer has not been initialized. Call TransactionContainer.setApp(app) during application bootstrap.',
      );
    }

    return this.app.get(type, {
      strict: false,
    });
  }
}
