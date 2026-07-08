import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './env.validation';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // متاح في كل التطبيق
      validationSchema: envValidationSchema, // تفعيل الحماية الصارمة
      validationOptions: {
        abortEarly: true, // التوقف عند أول خطأ واظهاره
      },
    }),
  ],
})
export class AppConfigModule {}
