import { Injectable } from '@nestjs/common';
import { TransactionalPrismaService } from '../../../packages/transaction/services/transactional-prisma.service';

@Injectable()
export class DeviceTokenRepository {
  constructor(private readonly prisma: TransactionalPrismaService) {}

  /**
   * يحفظ التوكن — إذا كان موجوداً مسبقاً (نفس user + token) يتجاهل الطلب.
   * Upserts the token — ignores duplicates (same user + token).
   */
  async upsert(userId: string, fcmToken: string, platform: string): Promise<void> {
    await this.prisma.client.user_device_token.upsert({
      where: { user_id_fcm_token: { user_id: userId, fcm_token: fcmToken } },
      create: { user_id: userId, fcm_token: fcmToken, platform },
      update: { platform },
    });
  }

  /** يحذف توكناً محدداً — يُستدعى عند logout */
  async delete(userId: string, fcmToken: string): Promise<void> {
    await this.prisma.client.user_device_token.deleteMany({
      where: { user_id: userId, fcm_token: fcmToken },
    });
  }

  /** يجلب كل توكنات مستخدم معين */
  async findByUserId(userId: string): Promise<string[]> {
    const rows = await this.prisma.client.user_device_token.findMany({
      where: { user_id: userId },
      select: { fcm_token: true },
    });
    return rows.map((r) => r.fcm_token);
  }

  /** يجلب توكنات مجموعة من المستخدمين دفعة وحدة */
  async findByUserIds(userIds: string[]): Promise<string[]> {
    if (!userIds.length) return [];
    const rows = await this.prisma.client.user_device_token.findMany({
      where: { user_id: { in: userIds } },
      select: { fcm_token: true },
    });
    return rows.map((r) => r.fcm_token);
  }
}

