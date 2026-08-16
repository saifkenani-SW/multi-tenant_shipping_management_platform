import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';

@Injectable()
export class SupportNotificationSeeder implements Seeder {
  private readonly logger = new Logger(SupportNotificationSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting SupportNotificationSeeder...');

    const tenant1 = SEEDED_TENANTS[0];
    const customerUser = await this.prisma.users.findUnique({
      where: { email: 'john.doe@email.com' },
    });
    const adminUser = await this.prisma.users.findUnique({
      where: { email: 'admin@fastship.com' },
    });

    if (!customerUser || !adminUser) {
      this.logger.warn(
        'Skipping SupportNotificationSeeder: missing customerUser or adminUser',
      );
      return;
    }

    const employee = await this.prisma.employee.findFirst({
      where: { tenant_id: tenant1.id, employee_code: 'EMP-101' },
    });
    const parcel = await this.prisma.parcel.findUnique({
      where: { id: '00000000-0000-7000-8000-000000001101' },
    });
    const shipment = await this.prisma.customer_shipment.findUnique({
      where: { id: '00000000-0000-7000-8000-000000000821' },
    });

    const ticketId = '00000000-0000-7000-8000-000000001301';
    const ticket = await this.prisma.support_ticket.upsert({
      where: { id: ticketId },
      update: {
        status: TicketStatus.IN_PROGRESS,
        subject: 'استفسار عن موعد وصول الطرد إلى حلب',
      },
      create: {
        id: ticketId,
        tenant_id: tenant1.id,
        submitted_by_user_id: customerUser.id,
        assigned_to_employee_id: employee ? employee.id : null,
        subject: 'استفسار عن موعد وصول الطرد إلى حلب',
        category: TicketCategory.DELIVERY,
        priority: TicketPriority.MEDIUM,
        parcel_id: parcel ? parcel.id : null,
        shipment_id: shipment ? shipment.id : null,
        status: TicketStatus.IN_PROGRESS,
      },
    });

    const msgId = '00000000-0000-7000-8000-000000001311';
    await this.prisma.support_ticket_message.upsert({
      where: { id: msgId },
      update: {
        message: 'السلام عليكم، متى يصل طردي رقم SHAM-2026-0001 إلى فرع العزيزية في حلب؟',
      },
      create: {
        id: msgId,
        ticket_id: ticket.id,
        sender_user_id: customerUser.id,
        message: 'السلام عليكم، متى يصل طردي رقم SHAM-2026-0001 إلى فرع العزيزية في حلب؟',
      },
    });

    const notifId = '00000000-0000-7000-8000-000000001321';
    await this.prisma.notification.upsert({
      where: { id: notifId },
      update: {
        status: NotificationStatus.DELIVERED,
        title: 'شحنتك قيد النقل',
        body: 'تم تحميل شحنتك من مركز دمشق وهي في الطريق إلى فرع حلب.',
      },
      create: {
        id: notifId,
        tenant_id: tenant1.id,
        recipient_user_id: customerUser.id,
        notification_type: NotificationType.SHIPMENT,
        title: 'شحنتك قيد النقل',
        body: 'تم تحميل شحنتك من مركز دمشق وهي في الطريق إلى فرع حلب.',
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.DELIVERED,
        is_read: false,
      },
    });

    const auditId = '00000000-0000-7000-8000-000000001331';
    await this.prisma.audit_log.upsert({
      where: { id: auditId },
      update: {
        event_type: 'SHIPMENT_CREATED',
      },
      create: {
        id: auditId,
        tenant_id: tenant1.id,
        actor_user_id: adminUser.id,
        actor_ip: '127.0.0.1',
        actor_user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        event_type: 'SHIPMENT_CREATED',
        entity_type: 'customer_shipment',
        entity_id: shipment ? shipment.id : null,
      },
    });

    this.logger.log('SupportNotificationSeeder completed.');
  }
}
