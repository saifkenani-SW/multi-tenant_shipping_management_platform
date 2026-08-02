import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { VehicleQueryCriteriaBuilder } from './application/builders/query/vehicle-query-criteria.builder';
import { VehicleResponseMapper } from './application/mappers/vehicle-response.mapper';
import { VehicleCommandService } from './application/services/vehicle-command.service';
import { VehicleQueryService } from './application/services/vehicle-query.service';
import { VehiclePersistenceMapper } from './infrastructure/mappers/vehicle-persistence.mapper';
import { VehicleCommandRepository } from './infrastructure/repositories/vehicle-command.repository';
import { VehicleQueryRepository } from './infrastructure/repositories/vehicle-query.repository';
import { VehicleController } from './presentation/controllers/vehicle.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [VehicleController],
  providers: [
    VehicleCommandRepository,
    VehicleQueryRepository,
    VehicleCommandService,
    VehicleQueryService,
    VehicleQueryCriteriaBuilder,
    VehiclePersistenceMapper,
    VehicleResponseMapper,
  ],
})
export class VehicleModule {}
