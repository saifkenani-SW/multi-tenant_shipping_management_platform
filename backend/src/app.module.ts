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
import { EmployeeModule } from './modules/employee/employee.module';
import { UserModule } from './modules/user/user.module';
import { FleetModule } from './modules/fleet/fleet.module';
import { Employee2Module } from './modules/employee2/employee2.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { LabelGeneratorModule } from './packages/label-generator';
import { PdfGeneratorModule } from './packages/pdf-generator';
import { StorageModule } from './packages/storage/src';
import { ShipmentRequestModule } from './modules/shipment-request/shipment-request.module';
import { CustomerShipmentModule } from './modules/customer-shipment/customer-shipment.module';
import { BillingModule } from './modules/billing/billing.module';
import { FirebaseNotificationModule } from './packages/firebase-notifications';
import { NotificationModule } from './modules/notification/notification.module';
import { ProfileModule } from './modules/profile/profile.module';

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
    Employee2Module,
    OrganizationModule,
    FleetModule,
    UserModule,
    TrackingModule,
    LabelGeneratorModule,
    PdfGeneratorModule,
    StorageModule.forRoot(),
    ShipmentRequestModule,
    CustomerShipmentModule,
    BillingModule,
    FirebaseNotificationModule.forRoot({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!,
    }),
    NotificationModule,
    ProfileModule,
  ],
  controllers: [AppController],
  providers: [AppService, GlobalExceptionFilter],
})
export class AppModule {}
