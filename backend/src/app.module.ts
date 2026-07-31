import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // استدعاء ConfigService
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AppConfigModule } from './infrastructure/config/app-config.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomerModule } from './modules/customer/customer.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { SubscriptionPlanModule } from './modules/subscription-plan/subscription-plan.module';
import { AuthorizationModule as ApplicationAuthorizationModule } from './modules/authorization/authorization.module';
import { GlobalLocationModule } from './modules/global-location/global-location.module';
import { OrganizationUnitModule } from './modules/organization-unit/organization-unit.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { LoggerModule } from 'nestjs-pino';

import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { CacheModule } from './infrastructure/cache/cache.module';
import { CaslModule } from './packages/authorization-casl';
import { AuthorizationModule } from './packages/authorization';
import { ContextModule } from './packages/context/context.module';
import { HealthModule } from './health/health.module';
import { ShipmentRequestModule } from './modules/shipment-request/shipment-request.module';

@Module({
  imports: [
    ContextModule,
    CaslModule.forRoot(),
    AuthorizationModule,
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
    ShipmentRequestModule,
    ApplicationAuthorizationModule,
    GlobalLocationModule,
    OrganizationUnitModule,
    EmployeeModule,
  ],
  controllers: [AppController],
  providers: [AppService, GlobalExceptionFilter],
})
export class AppModule {}
