import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T> {
  success: boolean;
  data: T;
  meta?: unknown;
  message?: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  StandardResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    return next.handle().pipe(
      map((res) => {
        // Bypass StreamableFile so the framework streams it directly
        if (res instanceof StreamableFile) {
          return res as any;
        }

        // already formatted response
        if (res && typeof res === 'object' && 'data' in res) {
          return {
            success: true,
            ...res,
          };
        }
        return {
          success: true,
          data: res,
        };
      }),
    );
  }
}
