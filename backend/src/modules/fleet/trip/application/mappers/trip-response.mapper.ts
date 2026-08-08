import { Injectable } from '@nestjs/common';
import { Pagination, PaginationMeta } from '../../../../../common/pagination';
import { Trip } from '../../domain/entities/trip.entity';
import { TripDetailsDto } from '../dtos/responses/trip-details.dto';
import {
  PaginatedTripListDto,
  TripListDto,
} from '../dtos/responses/trip-list.dto';

@Injectable()
export class TripResponseMapper {
  toListDto(trip: Trip): TripListDto {
    const dto = new TripListDto();
    dto.id = trip.id;
    dto.driverId = trip.driverId;
    dto.vehicleId = trip.vehicleId;
    dto.originOrgUnitId = trip.originOrgUnitId;
    dto.destinationOrgUnitId = trip.destinationOrgUnitId;
    dto.status = trip.status;
    dto.scheduledAt = trip.scheduledAt;
    return dto;
  }

  toDetailsDto(trip: Trip): TripDetailsDto {
    const dto = new TripDetailsDto();
    dto.id = trip.id;
    dto.tenantId = trip.tenantId;
    dto.driverId = trip.driverId;
    dto.vehicleId = trip.vehicleId;
    dto.originOrgUnitId = trip.originOrgUnitId;
    dto.destinationOrgUnitId = trip.destinationOrgUnitId;
    dto.status = trip.status;
    dto.scheduledAt = trip.scheduledAt;
    dto.startedAt = trip.startedAt;
    dto.endedAt = trip.endedAt;
    dto.notes = trip.notes;
    dto.createdAt = trip.createdAt;
    dto.updatedAt = trip.updatedAt;
    return dto;
  }

  toPaginatedListDto(
    trips: Trip[],
    total: number,
    pagination: Pagination,
  ): PaginatedTripListDto {
    const dto = new PaginatedTripListDto();
    dto.data = trips.map((trip) => this.toListDto(trip));
    dto.meta = new PaginationMeta(pagination, total);
    return dto;
  }
}
