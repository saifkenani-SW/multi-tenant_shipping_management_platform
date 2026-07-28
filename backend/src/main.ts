import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AuthorizationContainer } from './packages/authorization/authorization.container';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. أمن أساسي

  app.enableCors({
    origin: ['https://localhost:4200'],
    credentials: true,
  });
  app.use(helmet());
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

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  AuthorizationContainer.setApp(app);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
