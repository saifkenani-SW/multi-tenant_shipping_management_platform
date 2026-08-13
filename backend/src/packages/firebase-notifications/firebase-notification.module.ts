import { DynamicModule, Module } from '@nestjs/common';
import { FirebaseNotificationService } from './firebase-notification.service';
import { FIREBASE_NOTIFICATION_CONFIG } from './firebase-notification.constants';
import { FirebaseNotificationConfig } from './firebase-notification.config';

/**
 * موديول ثابت — بيتسجل مرة وحدة بالـ AppModule بأي مشروع.
 * Fixed module — registered once in AppModule of any project.
 *
 * Usage:
 * FirebaseNotificationModule.forRoot({
 *   projectId: process.env.FIREBASE_PROJECT_ID,
 *   clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
 *   privateKey: process.env.FIREBASE_PRIVATE_KEY,
 * })
 */
@Module({})
export class FirebaseNotificationModule {
  static forRoot(config: FirebaseNotificationConfig): DynamicModule {
    return {
      module: FirebaseNotificationModule,
      global: true,
      providers: [
        { provide: FIREBASE_NOTIFICATION_CONFIG, useValue: config },
        FirebaseNotificationService,
      ],
      exports: [FirebaseNotificationService],
    };
  }
}
