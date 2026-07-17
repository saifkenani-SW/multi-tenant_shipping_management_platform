import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. أمن أساسي
  app.use(helmet());
  app.enableCors({ credentials: true });
  app.use(cookieParser());

  // 2. إصدار الـ API (مهم جداً للمنصات الكبيرة)
  app.enableVersioning({ type: VersioningType.URI });

  // 3. Validation Pipe مع transform لتتمكن الـ DTOs من تحويل البيانات تلقائياً
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // 3.5 Global Filters and Interceptors
  app.useGlobalFilters(app.get(GlobalExceptionFilter));
  app.useGlobalInterceptors(new TransformInterceptor());

  // 4. Swagger Enterprise Configuration
  const config = new DocumentBuilder()
    .setTitle('Multi-Tenant Logistics Platform API')
    .setDescription(
      'The API documentation for the Multi-Tenant Logistics Platform',
    )
    .setVersion('1.0')
    .addBearerAuth()

    // التعديل هنا: اسم الـ Scheme كـ String، ثم الـ Object في الوسيط الثاني
    .addSecurity('x-tenant-id', {
      type: 'apiKey',
      in: 'header',
      name: 'x-tenant-id',
      description: 'Tenant Isolation ID',
    })
    .addSecurity('x-role', {
      type: 'apiKey',
      in: 'header',
      name: 'x-role',
      description: 'User Role (PLATFORM_OWNER, etc)',
    })

    // تفعيل المتطلبات
    .addSecurityRequirements('x-tenant-id')
    .addSecurityRequirements('x-role')
    .build();

  app.enableCors({
    origin: ['http://localhost:3000', 'https://your-frontend.com'], // ضع روابط الفرونت إند هنا
    credentials: true, // ⚠️ ضروري جداً لكي يسمح المتصفح بإرسال واستقبال الـ Cookies
  });

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
