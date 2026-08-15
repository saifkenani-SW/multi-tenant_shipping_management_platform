import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { FIREBASE_NOTIFICATION_CONFIG } from './firebase-notification.constants';
import type { FirebaseNotificationConfig } from './firebase-notification.config';
import type { INotificationMessage } from './message.type';
import { chunk } from './chunk.util';

/** حد Firebase الأقصى لعدد التوكنات بكل استدعاء sendEachForMulticast */
const MULTICAST_BATCH_LIMIT = 500;
/** حد Firebase الأقصى لعدد التوكنات بكل استدعاء subscribe/unsubscribeToTopic */
const TOPIC_BATCH_LIMIT = 1000;

export interface MulticastResult {
  successCount: number;
  failureCount: number;
  responses: unknown[];
}

export interface TopicManagementResult {
  successCount: number;
  failureCount: number;
  errors: unknown[];
}

/**
 * الخدمة المسؤولة عن الإرسال الفعلي عبر Firebase — منطق ثابت، ما بيتغير.
 * Handles the actual sending through Firebase — fixed logic, does not change.
 */
@Injectable()
export class FirebaseNotificationService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseNotificationService.name);
  private app: App;

  constructor(
    @Inject(FIREBASE_NOTIFICATION_CONFIG)
    private readonly config: FirebaseNotificationConfig,
  ) {}

  onModuleInit() {
    this.app = initializeApp(
      {
        credential: cert({
          projectId: this.config.projectId,
          clientEmail: this.config.clientEmail,
          // بيئات كتير بتخزن الـ private key بسطر وحد مع "\n" حرفية بدل سطر جديد فعلي
          privateKey: this.config.privateKey.replace(/\\n/g, '\n'),
        }),
      },
      'firebase-notification-app',
    );
  }

  private get messaging() {
    return getMessaging(this.app);
  }

  private buildPayload(message: INotificationMessage) {
    return {
      notification: {
        title: message.title,
        body: message.body,
        imageUrl: message.imageUrl,
      },
      data: message.data,
    };
  }

  /** إرسال لجهاز واحد — Send to a single device token */
  async sendToToken(
    token: string,
    message: INotificationMessage,
  ): Promise<string> {
    try {
      return await this.messaging.send({
        token,
        ...this.buildPayload(message),
      });
    } catch (error) {
      this.logger.error(
        `Failed to send notification to token: ${token}`,
        error as Error,
      );
      throw error;
    }
  }

  /**
   * إرسال لعدة أجهزة — يقسّم القائمة تلقائيًا لدفعات ≤500 توكن (حد FCM لكل
   * استدعاء) ويرسلها بالتوازي، ثم يجمع النتائج بنتيجة واحدة.
   *
   * Sends to multiple device tokens — automatically batches into chunks of
   * ≤500 (FCM's per-call limit), fires them in parallel, and aggregates the result.
   */
  async sendToTokens(
    tokens: string[],
    message: INotificationMessage,
  ): Promise<MulticastResult> {
    if (!tokens.length)
      return { successCount: 0, failureCount: 0, responses: [] };

    const payload = this.buildPayload(message);
    const batches = chunk(tokens, MULTICAST_BATCH_LIMIT);

    const results = await Promise.all(
      batches.map((batchTokens) =>
        this.messaging.sendEachForMulticast({
          tokens: batchTokens,
          ...payload,
        }),
      ),
    );

    return results.reduce<MulticastResult>(
      (acc, result) => ({
        successCount: acc.successCount + result.successCount,
        failureCount: acc.failureCount + result.failureCount,
        responses: [...acc.responses, ...result.responses],
      }),
      { successCount: 0, failureCount: 0, responses: [] },
    );
  }

  /** إرسال لموضوع (Topic) — Send to a topic */
  async sendToTopic(
    topic: string,
    message: INotificationMessage,
  ): Promise<string> {
    return this.messaging.send({
      topic,
      ...this.buildPayload(message),
    });
  }

  /**
   * اشتراك أجهزة بموضوع — يقسّم القائمة تلقائيًا لدفعات ≤1000 توكن (حد FCM).
   * Subscribes tokens to a topic — auto-batches into chunks of ≤1000 (FCM's limit).
   */
  async subscribeToTopic(
    tokens: string[],
    topic: string,
  ): Promise<TopicManagementResult> {
    return this.runTopicBatches(tokens, (batch) =>
      this.messaging.subscribeToTopic(batch, topic),
    );
  }

  /**
   * إلغاء اشتراك أجهزة من موضوع — يقسّم القائمة تلقائيًا لدفعات ≤1000 توكن.
   * Unsubscribes tokens from a topic — auto-batches into chunks of ≤1000.
   */
  async unsubscribeFromTopic(
    tokens: string[],
    topic: string,
  ): Promise<TopicManagementResult> {
    return this.runTopicBatches(tokens, (batch) =>
      this.messaging.unsubscribeFromTopic(batch, topic),
    );
  }

  /**
   * نقل أجهزة من توبيك لتوبيك بخطوة وحدة (إلغاء اشتراك من القديم + اشتراك
   * بالجديد بالتوازي). مفيد مثلاً وقت نقل موظف من فرع لفرع.
   *
   * Moves tokens from one topic to another in a single call (unsubscribe old +
   * subscribe new, in parallel). Useful e.g. when an employee moves branches.
   */
  async switchTopic(
    tokens: string[],
    fromTopic: string,
    toTopic: string,
  ): Promise<void> {
    if (!tokens.length) return;

    await Promise.all([
      this.unsubscribeFromTopic(tokens, fromTopic),
      this.subscribeToTopic(tokens, toTopic),
    ]);
  }

  private async runTopicBatches<
    T extends { successCount: number; failureCount: number; errors: unknown[] },
  >(
    tokens: string[],
    operation: (batch: string[]) => Promise<T>,
  ): Promise<TopicManagementResult> {
    if (!tokens.length) return { successCount: 0, failureCount: 0, errors: [] };

    const batches = chunk(tokens, TOPIC_BATCH_LIMIT);
    const results = await Promise.all(batches.map(operation));

    return results.reduce<TopicManagementResult>(
      (acc, result) => ({
        successCount: acc.successCount + result.successCount,
        failureCount: acc.failureCount + result.failureCount,
        errors: [...acc.errors, ...result.errors],
      }),
      { successCount: 0, failureCount: 0, errors: [] },
    );
  }
}
