// src/common/errors/api.error.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiError extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly errorType: string = 'BusinessLogicError',
    public readonly details?: any, // لتمرير تفاصيل إضافية إن لزم الأمر
  ) {
    super(message, statusCode);
  }

  // Enterprise Tip: Static Factory Methods (دوال مساعدة لتبسيط الاستخدام)

  static badRequest(message: string, details?: any) {
    return new ApiError(
      message,
      HttpStatus.BAD_REQUEST,
      'BadRequestError',
      details,
    );
  }

  static notFound(message: string, details?: any) {
    return new ApiError(
      message,
      HttpStatus.NOT_FOUND,
      'NotFoundError',
      details,
    );
  }

  static conflict(message: string, details?: any) {
    return new ApiError(message, HttpStatus.CONFLICT, 'ConflictError', details);
  }

  static forbidden(message: string, details?: any) {
    return new ApiError(
      message,
      HttpStatus.FORBIDDEN,
      'ForbiddenError',
      details,
    );
  }
  static internal(message = 'حدث خطأ داخلي في الخادم', details?: any) {
    return new ApiError(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'InternalServerError',
      details,
    );
  }

  static unauthorized(message: string, details?: any) {
    return new ApiError(
      message,
      HttpStatus.UNAUTHORIZED,
      'UnauthorizedError',
      details,
    );
  }

  static unprocessable(message: string, details?: any) {
    return new ApiError(
      message,
      HttpStatus.UNPROCESSABLE_ENTITY,
      'ValidationError',
      details,
    );
  }

  static tooManyRequests(message: string, details?: any) {
    return new ApiError(
      message,
      HttpStatus.TOO_MANY_REQUESTS,
      'TooManyRequestsError',
      details,
    );
  }

  static serviceUnavailable(message: string, details?: any) {
    return new ApiError(
      message,
      HttpStatus.SERVICE_UNAVAILABLE,
      'ServiceUnavailableError',
      details,
    );
  }
}
