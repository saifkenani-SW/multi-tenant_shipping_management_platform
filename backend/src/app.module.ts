import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config'; // استدعاء ConfigService
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AppConfigModule } from './infrastructure/config/app-config.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomerModule } from './modules/customer/customer.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { SubscriptionPlanModule } from './modules/subscription-plan/subscription-plan.module';
import { AuthorizationModule as AuthorizationBusinessModule } from './modules/authorization/authorization.module';
import { GlobalLocationModule } from './modules/global-location/global-location.module';
import { LoggerModule } from 'nestjs-pino';

import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { CacheModule } from './infrastructure/cache/cache.module';
import { CaslModule } from './packages/authorization-casl';
import { AuthorizationModule } from './packages/authorization';
import { ContextModule } from './packages/context/context.module';
import { HealthModule } from './health/health.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { LabelGeneratorModule } from './packages/label-generator/label-generator.module';
import { PdfGeneratorModule } from './packages/pdf-generator/pdf-generator.module';
import { StorageModule } from './packages/storage/src/storage.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { UserModule } from './modules/user/user.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';

@Module({
  imports: [
    ContextModule,
    CaslModule.forRoot(),
    AuthorizationModule,
    EventEmitterModule.forRoot(),
    LoggerModule.forRoot(),
    AppConfigModule,
    DatabaseModule,

    // تسجيل الكاش بشكل ديناميكي وقراءة الإعدادات من .env
    CacheModule.registerAsync({
      // نستخدم InMemory فقط إذا كنا في بيئة الـ Test
      useInMemory: process.env.NODE_ENV === 'test',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        host: configService.get<string>('REDIS_HOST', 'localhost'),
        // نستخدم المنفذ 63791 الذي حددته في Docker
        port: configService.get<number>('REDIS_PORT', 63791),
        password: configService.get<string>('REDIS_PASSWORD'), // اختياري
      }),
    }),

    HealthModule,
    AuthModule,
    CustomerModule,
    TenantModule,
    SubscriptionPlanModule,
    AuthorizationBusinessModule,
    GlobalLocationModule,
    EmployeeModule,
    VehicleModule,
    UserModule,
    TrackingModule,
    LabelGeneratorModule,
    PdfGeneratorModule,
    StorageModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService, GlobalExceptionFilter],
})
export class AppModule {}
