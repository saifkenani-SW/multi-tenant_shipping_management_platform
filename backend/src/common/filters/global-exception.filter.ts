import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ApiError } from '../errors/api.error';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(GlobalExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 🔴 تم التعديل إلى 'unknown' بدلاً من 'غير معروف' لمنع انهيار الـ Header
    const requestId = request['id'] || 'unknown';
    const method = request.method;
    const url = request.url;
    const actor = (request as any).user?.id || 'مجهول';
    const timestamp = new Date().toISOString();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'عذراً، حدث خطأ داخلي غير متوقع في الخادم';
    let errorType = 'خطأ_داخلي_في_الخادم';

    // ١. معالجة أخطاء ApiError المخصصة
    if (exception instanceof ApiError) {
      status = exception.getStatus();
      message = exception.message;
      errorType = exception.errorType;

      this.logger.warn(
        {
          requestId,
          method,
          url,
          actor,
          status,
          errorType,
          message,
          details: exception.details,
        },
        `خطأ API [${errorType}]: ${message}`,
      );
    }
    // ٢. معالجة أخطاء NestJS و Class-Validator (٤٠٠، ٤٠١، ٤٠٣، ٤٠٤...)
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        errorType = (exceptionResponse as any).error || exception.name;
      } else {
        message = exception.message;
        errorType = exception.name;
      }

      // 🔴 السر هنا: لا نترجم الرسالة إذا كانت مصفوفة (لأنها أخطاء Validation دقيقة)
      if (!Array.isArray(message)) {
        const translatedMessage = this.translateHttpError(status, message);
        if (translatedMessage) {
          message = translatedMessage;
        }
      } else {
        errorType = 'خطأ_في_التحقق_من_البيانات'; // تخصيص نوع الخطأ للـ Validation
      }

      // تحديد مستوى التسجيل
      if (status >= 500) {
        this.logger.error(
          {
            requestId,
            method,
            url,
            actor,
            status,
            errorType,
            message,
            err: exception,
          },
          `خطأ HTTP ${status}: ${errorType}`,
        );
      } else if (status >= 400) {
        this.logger.warn(
          { requestId, method, url, actor, status, errorType, message },
          `تحذير HTTP ${status}: ${errorType}`,
        );
      }
    }
    // ٣. معالجة أخطاء Prisma (قاعدة البيانات)
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      errorType = 'خطأ_في_قاعدة_البيانات';
      switch (exception.code) {
        case 'P2010':
          const originalCode = (exception.meta as any)?.driverAdapterError
            ?.cause?.originalCode;
          if (originalCode === '23503') {
            status = HttpStatus.BAD_REQUEST;
            message = 'فشل قيد المفتاح الخارجي - السجل المرتبط غير موجود';
          } else if (originalCode === '23505') {
            status = HttpStatus.CONFLICT;
            message = 'هذه البيانات موجودة بالفعل ولا يمكن تكرارها';
          } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'حدث خطأ غير متوقع في استعلام قاعدة البيانات';
          }
          break;
        case 'P2002':
          status = HttpStatus.CONFLICT;
          const target = (exception.meta as any)?.target;
          const field = Array.isArray(target) ? target.join('، ') : target;
          message = field
            ? `الحقل (${field}) مسجل لدينا بالفعل ولا يمكن تكراره`
            : 'هذه البيانات موجودة بالفعل ولا يمكن تكرارها';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'السجل المطلوب غير موجود';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          if (method === 'DELETE') {
            message = 'لا يمكن الحذف لوجود بيانات أخرى مرتبطة بهذا السجل';
          } else {
            message = 'فشل قيد المفتاح الخارجي - السجل المرتبط غير موجود';
          }
          break;
        case 'P2014':
          status = HttpStatus.BAD_REQUEST;
          message =
            'انتهاك في العلاقة - لا يمكن حذف السجل لارتباطه بسجلات أخرى';
          break;
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'حدث خطأ غير متوقع في قاعدة البيانات';
          break;
      }
      this.logger.error(
        {
          requestId,
          method,
          url,
          actor,
          status,
          errorType,
          prismaCode: exception.code,
          prismaMeta: exception.meta,
          message,
          err: exception,
        },
        `خطأ Prisma [${exception.code}]: ${message}`,
      );
    }
    // ٤. الأخطاء الحرجة
    else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'نعتذر، حدث خطأ داخلي في الخادم. يرجى المحاولة لاحقاً';
      errorType = 'انهيار_النظام';
      this.logger.fatal(
        {
          requestId,
          method,
          url,
          actor,
          status,
          errorType,
          errorName: exception?.name,
          errorMessage: exception?.message,
          err: exception,
          timestamp,
        },
        '💥🔥 انهيار نظام حرج',
      );
    }

    // 🔴 بناء الاستجابة النهائية
    // إذا كانت مصفوفة (Validation)، نأخذ أول رسالة لتكون واضحة في message
    const finalMessage = Array.isArray(message) ? message[0] : message;

    const responseBody: any = {
      success: false,
      message: finalMessage,
      error: errorType,
      // نرسل تفاصيل أخطاء الـ Validation كاملة للـ Frontend
      details: Array.isArray(message) ? message : undefined,
    };

    if (process.env.NODE_ENV !== 'production' && status === 500) {
      responseBody.devDetails = {
        message: exception?.message || String(exception),
        stack: exception?.stack?.split('\n').slice(0, 5),
        errorName: exception?.name,
      };
    }

    // تعيين الـ Header بشكل آمن الآن
    response.setHeader('X-Request-Id', String(requestId));
    response.status(status).json(responseBody);
  }

  private translateHttpError(status: number, message: any): string | null {
    if (typeof message === 'string' && /[\u0600-\u06FF]/.test(message))
      return null;

    const translations: Record<number, Record<string, string>> = {
      400: {
        'Bad Request': 'طلب غير صالح',
        'Validation failed': 'فشل التحقق',
        'Invalid input': 'مدخلات غير صالحة',
      },
      401: {
        Unauthorized: 'غير مصرح - يرجى تسجيل الدخول',
        'Invalid credentials': 'بيانات الدخول غير صحيحة',
      },
      403: { Forbidden: 'محظور - ليس لديك صلاحية' },
      404: { 'Not Found': 'المورد المطلوب غير موجود' },
      409: { Conflict: 'تعارض في البيانات' },
      422: { 'Unprocessable Entity': 'لا يمكن معالجة البيانات' },
      429: { 'Too Many Requests': 'طلبات كثيرة جداً' },
      500: { 'Internal Server Error': 'خطأ داخلي في الخادم' },
      502: { 'Bad Gateway': 'خطأ بوابة' },
      503: { 'Service Unavailable': 'الخدمة غير متاحة' },
    };

    const statusTranslations = translations[status];
    if (!statusTranslations) return null;

    if (typeof message === 'string') {
      for (const [key, value] of Object.entries(statusTranslations)) {
        if (message.toLowerCase().includes(key.toLowerCase())) return value;
      }
      return null;
    }
    return null;
  }
}
