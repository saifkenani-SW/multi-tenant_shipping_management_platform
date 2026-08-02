import { Injectable } from '@nestjs/common';
import { Pagination, PaginationMeta } from '../../../../common/pagination';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { VehicleDetailsDto } from '../dtos/responses/vehicle-details.dto';
import {
  PaginatedVehicleListDto,
  VehicleListDto,
} from '../dtos/responses/vehicle-list.dto';

@Injectable()
export class VehicleResponseMapper {
  toListDto(vehicle: Vehicle): VehicleListDto {
    const dto = new VehicleListDto();
    dto.id = vehicle.id;
    dto.plateNumber = vehicle.plateNumber;
    dto.type = vehicle.type;
    dto.status = vehicle.status;
    return dto;
  }

  toDetailsDto(vehicle: Vehicle): VehicleDetailsDto {
    const dto = new VehicleDetailsDto();
    dto.id = vehicle.id;
    dto.tenantId = vehicle.tenantId;
    dto.plateNumber = vehicle.plateNumber;
    dto.type = vehicle.type;
    dto.capacityKg = vehicle.capacityKg;
    dto.status = vehicle.status;
    dto.createdAt = vehicle.createdAt;
    dto.updatedAt = vehicle.updatedAt;
    return dto;
  }

  toPaginatedListDto(
    vehicles: Vehicle[],
    total: number,
    pagination: Pagination,
  ): PaginatedVehicleListDto {
    const dto = new PaginatedVehicleListDto();
    dto.data = vehicles.map((vehicle) => this.toListDto(vehicle));
    dto.meta = new PaginationMeta(pagination, total);
    return dto;
  }
}
