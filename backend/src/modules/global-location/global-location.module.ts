import { Module } from '@nestjs/common';
import { GlobalLocationController } from './presentation/controllers/global-location.controller';
import { GlobalLocationCommandService } from './application/services/global-location.command.service';
import { GlobalLocationQueryService } from './application/services/global-location.query.service';
import { GlobalLocationCommandRepository } from './infrastructure/repositories/global-location.command.repository';
import { GlobalLocationQueryRepository } from './infrastructure/repositories/global-location.query.repository';
import { GlobalLocationFacade } from './facades/global-location.facade';

@Module({
  controllers: [GlobalLocationController],
  providers: [
    GlobalLocationCommandService,
    GlobalLocationQueryService,
    GlobalLocationCommandRepository,
    GlobalLocationQueryRepository,
    GlobalLocationFacade,
  ],
  exports: [GlobalLocationFacade],
})
export class GlobalLocationModule {}
