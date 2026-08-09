import { Injectable } from '@nestjs/common';
import { VehicleQueryRepository } from '../../infrastructure/repositories/vehicle-query.repository';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { VehicleNotFoundException } from '../../domain/exceptions/vehicle-not-found.exception';
import { VehicleQueryCriteriaBuilder } from '../builders/query/vehicle-query-criteria.builder';
import { VehicleQueryDto } from '../dtos/requests/vehicle-query.dto';
import { VehicleDetailsDto } from '../dtos/responses/vehicle-details.dto';
import { PaginatedVehicleListDto } from '../dtos/responses/vehicle-list.dto';
import { VehicleAssignmentDto } from '../dtos/responses/vehicle-assignment.dto';
import { VehicleResponseMapper } from '../mappers/vehicle-response.mapper';

@Injectable()
export class VehicleQueryService {
  constructor(
    private readonly vehicleQueryRepository: VehicleQueryRepository,
    private readonly vehicleQueryCriteriaBuilder: VehicleQueryCriteriaBuilder,
    private readonly vehicleResponseMapper: VehicleResponseMapper,
  ) {}

  async findVehicles(
    tenantId: string,
    query: VehicleQueryDto,
  ): Promise<PaginatedVehicleListDto> {
    const criteria = this.vehicleQueryCriteriaBuilder.build(query, tenantId);
    const [vehicles, total] =
      await this.vehicleQueryRepository.findMany(criteria);

    return this.vehicleResponseMapper.toPaginatedListDto(
      vehicles,
      total,
      criteria.pagination,
    );
  }

  async getVehicleDetails(
    tenantId: string,
    id: string,
  ): Promise<VehicleDetailsDto> {
    const vehicle = await this.findVehicleOrThrow(tenantId, id);
    return this.vehicleResponseMapper.toDetailsDto(vehicle);
  }

  async getVehicleAssignments(
    tenantId: string,
    vehicleId: string,
  ): Promise<VehicleAssignmentDto[]> {
    await this.findVehicleOrThrow(tenantId, vehicleId);

    const assignments =
      await this.vehicleQueryRepository.findAssignmentsByVehicle(
        tenantId,
        vehicleId,
      );

    return assignments.map((assignment) =>
      this.vehicleResponseMapper.toAssignmentDto(assignment),
    );
  }

  /**
   * Returns the domain entity. Used by sibling Fleet sub-domains (trip) that
   * need to reason about the vehicle rather than render it.
   */
  async findVehicleOrThrow(tenantId: string, id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleQueryRepository.findById(tenantId, id);

    if (!vehicle) {
      throw new VehicleNotFoundException();
    }

    return vehicle;
  }

  async getActiveVehicleIdForDriver(
    tenantId: string,
    employeeId: string,
  ): Promise<string | null> {
    const assignment =
      await this.vehicleQueryRepository.findActiveAssignmentByEmployee(
        tenantId,
        employeeId,
      );

    return assignment?.vehicleId ?? null;
  }
}
