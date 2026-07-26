import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { AsyncContextProvider } from './providers/async-context.provider';
import { RequestContextService } from './services/request-context.service';
import { ContextMiddleware } from './middlewares/context.middleware';

@Global()
@Module({
  providers: [AsyncContextProvider, RequestContextService, ContextMiddleware],

  exports: [AsyncContextProvider, RequestContextService],
})
export class ContextModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(ContextMiddleware).forRoutes('*');
  }
}
