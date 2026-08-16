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
  toListDto(
    trip: Trip,
    driverName?: string,
    vehiclePlateNumber?: string,
    originOrgUnitName?: string,
    destinationOrgUnitName?: string,
  ): TripListDto {
    const dto = new TripListDto();
    dto.id = trip.id;
    dto.driverId = trip.driverId;
    dto.driverName = driverName;
    dto.vehicleId = trip.vehicleId;
    dto.vehiclePlateNumber = vehiclePlateNumber;
    dto.originOrgUnitId = trip.originOrgUnitId;
    dto.originOrgUnitName = originOrgUnitName;
    dto.destinationOrgUnitId = trip.destinationOrgUnitId;
    dto.destinationOrgUnitName = destinationOrgUnitName;
    dto.status = trip.status;
    dto.scheduledAt = trip.scheduledAt;
    dto.createdByEmployeeId = trip.createdByEmployeeId;
    dto.createdByEmployeeName = trip.createdByEmployeeName;
    return dto;
  }

  toDetailsDto(
    trip: Trip,
    driverName?: string,
    vehiclePlateNumber?: string,
    originOrgUnitName?: string,
    destinationOrgUnitName?: string,
  ): TripDetailsDto {
    const dto = new TripDetailsDto();
    dto.id = trip.id;
    dto.tenantId = trip.tenantId;
    dto.driverId = trip.driverId;
    dto.driverName = driverName;
    dto.vehicleId = trip.vehicleId;
    dto.vehiclePlateNumber = vehiclePlateNumber;
    dto.originOrgUnitId = trip.originOrgUnitId;
    dto.originOrgUnitName = originOrgUnitName;
    dto.destinationOrgUnitId = trip.destinationOrgUnitId;
    dto.destinationOrgUnitName = destinationOrgUnitName;
    dto.status = trip.status;
    dto.scheduledAt = trip.scheduledAt;
    dto.startedAt = trip.startedAt;
    dto.endedAt = trip.endedAt;
    dto.notes = trip.notes;
    dto.createdByEmployeeId = trip.createdByEmployeeId;
    dto.createdByEmployeeName = trip.createdByEmployeeName;
    dto.createdAt = trip.createdAt;
    dto.updatedAt = trip.updatedAt;
    return dto;
  }

  toPaginatedListDto(
    trips: Trip[],
    total: number,
    pagination: Pagination,
    driverNamesMap: Record<string, string>,
    vehiclePlatesMap: Record<string, string>,
    orgUnitNamesMap: Record<string, string>,
  ): PaginatedTripListDto {
    const dto = new PaginatedTripListDto();
    dto.data = trips.map((trip) =>
      this.toListDto(
        trip,
        driverNamesMap[trip.driverId],
        trip.vehicleId ? vehiclePlatesMap[trip.vehicleId] : undefined,
        orgUnitNamesMap[trip.originOrgUnitId],
        orgUnitNamesMap[trip.destinationOrgUnitId],
      ),
    );
    dto.meta = new PaginationMeta(pagination, total);
    return dto;
  }
}
