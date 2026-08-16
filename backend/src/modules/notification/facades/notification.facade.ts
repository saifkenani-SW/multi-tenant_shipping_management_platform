import { Injectable, Logger } from '@nestjs/common';

import { INotificationMessage } from '../../../packages/firebase-notifications';
import { NotificationService } from '../application/notification.service';

/**
 * The only way other modules reach Notification.
 *
 * Every method here swallows its own failures. A push is an advisory copy of
 * something the database already recorded: if Firebase is down, or the account
 * has no device registered, the business operation that triggered the push must
 * still succeed. Callers therefore never need a try/catch of their own.
 */
@Injectable()
export class NotificationFacade {
  private readonly logger = new Logger(NotificationFacade.name);

  constructor(private readonly notificationService: NotificationService) {}

  async notifyUser(
    userId: string,
    message: INotificationMessage,
  ): Promise<void> {
    try {
      await this.notificationService.sendToUser(userId, message);
    } catch (error) {
      this.logger.warn(
        `Failed to notify user ${userId}: ${(error as Error).message}`,
      );
    }
  }

  async registerToken(
    userId: string,
    fcmToken: string,
    platform: string = 'unknown',
  ): Promise<void> {
    try {
      await this.notificationService.registerToken(userId, fcmToken, platform);
    } catch (error) {
      this.logger.warn(
        `Failed to register token for user ${userId}: ${(error as Error).message}`,
      );
    }
  }

  async subscribeTokenToTopics(
    fcmToken: string,
    topics: string[],
  ): Promise<void> {
    try {
      for (const topic of topics) {
        await this.notificationService.subscribeTokenToTopic([fcmToken], topic);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to subscribe token to topics: ${(error as Error).message}`,
      );
    }
  }
}
