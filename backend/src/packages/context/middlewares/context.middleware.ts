import { Injectable, NestMiddleware } from '@nestjs/common';

import { Request, Response, NextFunction } from 'express';

import { randomUUID } from 'crypto';

import { AsyncContextProvider } from '../providers/async-context.provider';

@Injectable()
export class ContextMiddleware implements NestMiddleware {
  constructor(private readonly provider: AsyncContextProvider) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = randomUUID();
    const context = {
      requestId: requestId,

      correlationId: req.headers['x-correlation-id']?.toString(),
    };

    console.log('MIDDLEWARE =>', requestId);
    this.provider.run(context, next);
  }
}
