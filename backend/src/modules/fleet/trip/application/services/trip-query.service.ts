import { Injectable } from '@nestjs/common';
import { TripQueryRepository } from '../../infrastructure/repositories/trip-query.repository';
import { Trip } from '../../domain/entities/trip.entity';
import { TripNotFoundException } from '../../domain/exceptions/trip-not-found.exception';
import { TripQueryCriteriaBuilder } from '../builders/query/trip-query-criteria.builder';
import { TripQueryDto } from '../dtos/requests/trip-query.dto';
import { TripDetailsDto } from '../dtos/responses/trip-details.dto';
import { PaginatedTripListDto } from '../dtos/responses/trip-list.dto';
import { TripResponseMapper } from '../mappers/trip-response.mapper';

@Injectable()
export class TripQueryService {
  constructor(
    private readonly tripQueryRepository: TripQueryRepository,
    private readonly tripQueryCriteriaBuilder: TripQueryCriteriaBuilder,
    private readonly tripResponseMapper: TripResponseMapper,
  ) {}

  async findTrips(
    tenantId: string,
    query: TripQueryDto,
  ): Promise<PaginatedTripListDto> {
    const criteria = this.tripQueryCriteriaBuilder.build(query, tenantId);
    const [trips, total] = await this.tripQueryRepository.findMany(criteria);

    return this.tripResponseMapper.toPaginatedListDto(
      trips,
      total,
      criteria.pagination,
    );
  }

  async getTripDetails(tenantId: string, id: string): Promise<TripDetailsDto> {
    const trip = await this.findTripOrThrow(tenantId, id);
    return this.tripResponseMapper.toDetailsDto(trip);
  }

  /**
   * Returns the aggregate itself so callers can ask it to decide a transition.
   * Used by the trip command service and by the manifest sub-domain.
   */
  async findTripOrThrow(tenantId: string, id: string): Promise<Trip> {
    const trip = await this.tripQueryRepository.findById(tenantId, id);

    if (!trip) {
      throw new TripNotFoundException();
    }

    return trip;
  }

  async countManifests(tenantId: string, tripId: string): Promise<number> {
    return this.tripQueryRepository.countManifests(tenantId, tripId);
  }
}
