import { Module } from '@nestjs/common';
import { NotificationService } from './application/notification.service';
import { NotificationController } from './presentation/notification.controller';
import { DeviceTokenRepository } from './infrastructure/device-token.repository';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, DeviceTokenRepository],
  exports: [NotificationService],
})
export class NotificationModule {}
