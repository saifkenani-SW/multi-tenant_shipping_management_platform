import { Injectable, ForbiddenException } from '@nestjs/common';
import { TripQueryRepository } from '../../infrastructure/repositories/trip-query.repository';
import { Trip } from '../../domain/entities/trip.entity';
import { TripNotFoundException } from '../../domain/exceptions/trip-not-found.exception';
import { TripQueryDto } from '../dtos/requests/trip-query.dto';
import { TripDetailsDto } from '../dtos/responses/trip-details.dto';
import { PaginatedTripListDto } from '../dtos/responses/trip-list.dto';
import { TripResponseMapper } from '../mappers/trip-response.mapper';
import { TripQueryCriteria } from '../builders/query/trip-query-criteria';
import { OffsetPaginationBuilder } from '../../../../../common/pagination';
import { AuthorizationFacade } from '../../../../../packages/authorization/facade/authorization.facade';
import { TripVisibilityScope } from '../../domain/authorization/scopes/trip-visibility.scope';

@Injectable()
export class TripQueryService {
  constructor(
    private readonly tripQueryRepository: TripQueryRepository,
    private readonly tripResponseMapper: TripResponseMapper,
    private readonly authorizationFacade: AuthorizationFacade,
  ) {}

  async findTrips(
    tenantId: string | undefined,
    query: TripQueryDto,
  ): Promise<PaginatedTripListDto> {
    const scope = this.authorizationFacade.buildScope({
      builder: TripVisibilityScope,
    });

    if (tenantId && scope?.tenantId && tenantId !== scope.tenantId) {
      throw new ForbiddenException('Tenant mismatch');
    }

    const criteria: TripQueryCriteria = {
      tenantId: scope?.tenantId || tenantId,
      scopeOrgUnitIds: scope?.orgUnitIds,
      driverId: scope?.driverId || query.driverId,
      status: query.status,
      vehicleId: query.vehicleId,
      originOrgUnitId: query.originOrgUnitId,
      destinationOrgUnitId: query.destinationOrgUnitId,
      pagination: OffsetPaginationBuilder.build(query),
    };

    if (scope?.orgUnitIds && query.originOrgUnitId) {
      if (!scope.orgUnitIds.includes(query.originOrgUnitId)) {
        throw new ForbiddenException(
          'You can only filter by an origin unit within your scope',
        );
      }
    }

    if (scope?.orgUnitIds && query.destinationOrgUnitId) {
      if (!scope.orgUnitIds.includes(query.destinationOrgUnitId)) {
        throw new ForbiddenException(
          'You can only filter by a destination unit within your scope',
        );
      }
    }

    const [trips, total] = await this.tripQueryRepository.findMany(criteria);

    return this.tripResponseMapper.toPaginatedListDto(
      trips,
      total,
      criteria.pagination,
    );
  }

  async getTripDetails(
    tenantId: string | undefined,
    id: string,
  ): Promise<TripDetailsDto> {
    const trip = await this.findTripOrThrow(tenantId, id);
    return this.tripResponseMapper.toDetailsDto(trip);
  }

  async findTripOrThrow(
    tenantId: string | undefined,
    id: string,
  ): Promise<Trip> {
    const trip = await this.tripQueryRepository.findById(tenantId, id);

    if (!trip) {
      throw new TripNotFoundException();
    }

    return trip;
  }

  async countManifests(tenantId: string, tripId: string): Promise<number> {
    return this.tripQueryRepository.countManifests(tenantId, tripId);
  }

  async findMyActiveTrip(
    tenantId: string,
    driverId: string,
  ): Promise<TripDetailsDto | null> {
    const trip = await this.tripQueryRepository.findActiveTripByDriver(
      tenantId,
      driverId,
    );
    if (!trip) return null;
    return this.tripResponseMapper.toDetailsDto(trip);
  }
}
