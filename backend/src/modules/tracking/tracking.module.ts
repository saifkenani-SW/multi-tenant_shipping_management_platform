import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { TrackingCommandRepository } from './infrastructure/repositories/tracking.command.repository';
import { TrackingCommandService } from './application/services/tracking.command.service';
import { TrackingFacade } from './application/facades/tracking.facade';

@Module({
  imports: [DatabaseModule],
  providers: [
    TrackingCommandRepository,
    TrackingCommandService,
    TrackingFacade,
  ],
  exports: [TrackingFacade],
})
export class TrackingModule {}
