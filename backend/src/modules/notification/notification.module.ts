import { Module } from '@nestjs/common';
import { NotificationService } from './application/notification.service';
import { NotificationController } from './presentation/notification.controller';
import { NotificationFacade } from './facades/notification.facade';
import { DeviceTokenRepository } from './infrastructure/device-token.repository';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, DeviceTokenRepository, NotificationFacade],
  // Only the facade leaves the module — NotificationService stays internal.
  exports: [NotificationFacade],
})
export class NotificationModule {}
