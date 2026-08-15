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

import { EmployeeFacade } from '../../../../employee2/facades/employee.facade';

/**
 * Read side of the vehicle sub-domain.
 *
 * `tenantId` is optional throughout: a platform owner carries no tenant in the
 * request context and reads across every tenant, while any other caller is
 * always scoped to their own.
 */
@Injectable()
export class VehicleQueryService {
  constructor(
    private readonly vehicleQueryRepository: VehicleQueryRepository,
    private readonly vehicleQueryCriteriaBuilder: VehicleQueryCriteriaBuilder,
    private readonly vehicleResponseMapper: VehicleResponseMapper,
    private readonly employeeFacade: EmployeeFacade,
  ) {}

  async findVehicles(
    tenantId: string | undefined,
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
    tenantId: string | undefined,
    id: string,
  ): Promise<VehicleDetailsDto> {
    const vehicle = await this.findVehicleOrThrow(tenantId, id);
    return this.vehicleResponseMapper.toDetailsDto(vehicle);
  }

  async getVehicleAssignments(
    tenantId: string | undefined,
    vehicleId: string,
  ): Promise<VehicleAssignmentDto[]> {
    const vehicle = await this.findVehicleOrThrow(tenantId, vehicleId);

    const assignments =
      await this.vehicleQueryRepository.findAssignmentsByVehicle(
        tenantId,
        vehicleId,
      );

    const employeeIds = assignments.map((a) => a.employeeId);
    const employeesDetails =
      await this.employeeFacade.getEmployeesBasicDetails(employeeIds);

    return assignments.map((assignment) => {
      const dto = this.vehicleResponseMapper.toAssignmentDto(assignment);
      const employee = employeesDetails.find((e) => e.id === dto.employeeId);
      if (employee) {
        dto.employeeName = employee.full_name;
        dto.employeeCode = employee.employee_code;
      }
      dto.vehiclePlateNumber = vehicle.plateNumber;
      return dto;
    });
  }

  /**
   * Returns the domain entity. Used by sibling Fleet sub-domains (trip) that
   * need to reason about the vehicle rather than render it; those callers
   * always pass a tenant.
   */
  async findVehicleOrThrow(
    tenantId: string | undefined,
    id: string,
  ): Promise<Vehicle> {
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
