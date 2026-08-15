import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { TrackingCommandRepository } from './infrastructure/repositories/tracking.command.repository';
import { TrackingCommandService } from './application/services/tracking.command.service';
import { TrackingFacade } from './application/facades/tracking.facade';
import { LabelGeneratorModule } from '../../packages/label-generator/label-generator.module';
import { TrackingQueryRepository } from './infrastructure/repositories/tracking.query.repository';
import { TrackingQueryService } from './application/services/tracking.query.service';

@Module({
  imports: [DatabaseModule, LabelGeneratorModule, EventEmitterModule],
  providers: [
    TrackingCommandRepository,
    TrackingCommandService,
    TrackingFacade,
    TrackingQueryRepository,
    TrackingQueryService,
  ],
  exports: [TrackingFacade],
})
export class TrackingModule {}
