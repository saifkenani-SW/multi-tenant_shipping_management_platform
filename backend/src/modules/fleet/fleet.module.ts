import { Module } from '@nestjs/common';
import { Employee2Module } from '../employee2/employee2.module';
import { OrganizationModule } from '../organization/organization.module';

import { FleetFacade } from './facades/fleet.facade';

import { VehicleController } from './vehicle/presentation/controllers/vehicle.controller';
import { VehicleCommandService } from './vehicle/application/services/vehicle-command.service';
import { VehicleQueryService } from './vehicle/application/services/vehicle-query.service';
import { VehicleQueryCriteriaBuilder } from './vehicle/application/builders/query/vehicle-query-criteria.builder';
import { VehicleResponseMapper } from './vehicle/application/mappers/vehicle-response.mapper';
import { VehicleCommandRepository } from './vehicle/infrastructure/repositories/vehicle-command.repository';
import { VehicleQueryRepository } from './vehicle/infrastructure/repositories/vehicle-query.repository';
import { VehiclePersistenceMapper } from './vehicle/infrastructure/mappers/vehicle-persistence.mapper';
import { VehicleAssignmentPersistenceMapper } from './vehicle/infrastructure/mappers/vehicle-assignment-persistence.mapper';

import { TripController } from './trip/presentation/controllers/trip.controller';
import { TripCommandService } from './trip/application/services/trip-command.service';
import { TripQueryService } from './trip/application/services/trip-query.service';
import { TripQueryCriteriaBuilder } from './trip/application/builders/query/trip-query-criteria.builder';
import { TripResponseMapper } from './trip/application/mappers/trip-response.mapper';
import { TripCommandRepository } from './trip/infrastructure/repositories/trip-command.repository';
import { TripQueryRepository } from './trip/infrastructure/repositories/trip-query.repository';
import { TripPersistenceMapper } from './trip/infrastructure/mappers/trip-persistence.mapper';

import { TransportManifestController } from './transport_manifest/presentation/controllers/transport-manifest.controller';
import { ManifestCommandService } from './transport_manifest/application/services/manifest-command.service';
import { ManifestQueryService } from './transport_manifest/application/services/manifest-query.service';
import { ManifestQueryCriteriaBuilder } from './transport_manifest/application/builders/query/manifest-query-criteria.builder';
import { ManifestResponseMapper } from './transport_manifest/application/mappers/manifest-response.mapper';
import { TransportManifestCommandRepository } from './transport_manifest/infrastructure/repositories/transport-manifest-command.repository';
import { TransportManifestQueryRepository } from './transport_manifest/infrastructure/repositories/transport-manifest-query.repository';
import { TransportManifestPersistenceMapper } from './transport_manifest/infrastructure/mappers/transport-manifest-persistence.mapper';

/**
 * Fleet module — the Transport bounded context.
 *
 * Groups three closely-coupled sub-domains behind one boundary: vehicles
 * (with their driver assignments), trips, and transport manifests (with their
 * manifest items).
 *
 * Only FleetFacade is exported: nothing inside is reachable from other modules.
 * Conversely, Fleet reaches employees and organization units solely through
 * their own facades, and never touches the parcel table — the manifest_item
 * foreign key is what validates a parcel id.
 */
@Module({
  imports: [Employee2Module, OrganizationModule],
  controllers: [VehicleController, TripController, TransportManifestController],
  providers: [
    // vehicle
    VehicleCommandService,
    VehicleQueryService,
    VehicleCommandRepository,
    VehicleQueryRepository,
    VehicleQueryCriteriaBuilder,
    VehicleResponseMapper,
    VehiclePersistenceMapper,
    VehicleAssignmentPersistenceMapper,

    // trip
    TripCommandService,
    TripQueryService,
    TripCommandRepository,
    TripQueryRepository,
    TripQueryCriteriaBuilder,
    TripResponseMapper,
    TripPersistenceMapper,

    // transport manifest
    ManifestCommandService,
    ManifestQueryService,
    TransportManifestCommandRepository,
    TransportManifestQueryRepository,
    ManifestQueryCriteriaBuilder,
    ManifestResponseMapper,
    TransportManifestPersistenceMapper,

    FleetFacade,
  ],
  exports: [FleetFacade],
})
export class FleetModule {}
