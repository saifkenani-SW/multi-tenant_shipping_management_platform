import { Injectable } from '@nestjs/common';
import {
  FirebaseNotificationService,
  INotificationMessage,
} from '../../../packages/firebase-notifications';
import { DeviceTokenRepository } from '../infrastructure/device-token.repository';

@Injectable()
export class NotificationService {
  constructor(
    private readonly firebase: FirebaseNotificationService,
    private readonly deviceTokenRepo: DeviceTokenRepository,
  ) {}

  /** يسجّل توكن جهاز لمستخدم */
  async registerToken(
    userId: string,
    fcmToken: string,
    platform: string,
  ): Promise<void> {
    await this.deviceTokenRepo.upsert(userId, fcmToken, platform);
  }

  /** يحذف توكن جهاز (عند logout) */
  async removeToken(userId: string, fcmToken: string): Promise<void> {
    await this.deviceTokenRepo.delete(userId, fcmToken);
  }

  /**
   * يرسل إشعاراً لمستخدم واحد عبر كل أجهزته المسجّلة.
   * Sends a notification to a single user across all their registered devices.
   */
  async sendToUser(
    userId: string,
    message: INotificationMessage,
  ): Promise<void> {
    const tokens = await this.deviceTokenRepo.findByUserId(userId);
    if (!tokens.length) return;
    await this.firebase.sendToTokens(tokens, message);
  }

  /**
   * يرسل إشعاراً لمجموعة مستخدمين.
   * Sends a notification to multiple users.
   */
  async sendToUsers(
    userIds: string[],
    message: INotificationMessage,
  ): Promise<void> {
    const tokens = await this.deviceTokenRepo.findByUserIds(userIds);
    if (!tokens.length) return;
    await this.firebase.sendToTokens(tokens, message);
  }

  /**
   * يرسل إشعاراً لتوبيك — مفيد للإشعارات العامة (مثل إشعارات التينانت كله).
   * Sends a notification to a topic — useful for broadcast notifications.
   */
  async sendToTopic(
    topic: string,
    message: INotificationMessage,
  ): Promise<void> {
    await this.firebase.sendToTopic(topic, message);
  }
}
