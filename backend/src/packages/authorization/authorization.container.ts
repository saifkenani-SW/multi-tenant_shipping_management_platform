import { INestApplicationContext, Type } from '@nestjs/common';

export class AuthorizationContainer {
  private static app: INestApplicationContext;

  static setApp(app: INestApplicationContext): void {
    this.app = app;
  }

  static get<T>(type: Type<T>): T {
    if (!this.app) {
      throw new Error(
        'AuthorizationContainer has not been initialized. Call AuthorizationContainer.setApp(app) during application bootstrap.',
      );
    }

    return this.app.get(type, {
      strict: false,
    });
  }
}
