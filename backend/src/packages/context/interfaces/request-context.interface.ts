import { Principal } from '../principal/principal/Principal';

export interface RequestContext {
  requestId: string;
  correlationId?: string;
  traceId?: string;
  principal?: Principal;

  metadata?: Record<string, unknown>;

  /**
   * تخزين مؤقت مرتبط بعمر الـ Request.
   *
   * يُستخدم بواسطة @Cacheable لتجنب الضرب على Redis
   * أكثر من مرة لنفس المفتاح في نفس الطلب.
   *
   * يُهيَّأ lazily عند أول عملية تخزين.
   */
  cache?: Map<string, unknown>;
}
