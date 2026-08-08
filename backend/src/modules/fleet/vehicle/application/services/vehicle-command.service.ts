import { Injectable } from '@nestjs/common';
import { Transactional } from '../../../../../packages/transaction';
import { EmployeeFacade } from '../../../../employee2/facades/employee.facade';
import { VehicleCommandRepository } from '../../infrastructure/repositories/vehicle-command.repository';
import { VehicleQueryRepository } from '../../infrastructure/repositories/vehicle-query.repository';
import { DuplicateVehiclePlateException } from '../../domain/exceptions/duplicate-vehicle-plate.exception';
import { VehicleNotFoundException } from '../../domain/exceptions/vehicle-not-found.exception';
import { DriverNotFoundException } from '../../domain/exceptions/driver-not-found.exception';
import { DriverAlreadyAssignedException } from '../../domain/exceptions/driver-already-assigned.exception';
import { VehicleAlreadyAssignedException } from '../../domain/exceptions/vehicle-already-assigned.exception';
import { VehicleAssignmentNotFoundException } from '../../domain/exceptions/vehicle-assignment-not-found.exception';
import { VehicleStatus } from '../../domain/enums/vehicle-status.enum';
import { CreateVehicleDto } from '../dtos/requests/create-vehicle.dto';
import { UpdateVehicleDto } from '../dtos/requests/update-vehicle.dto';
import { AssignDriverDto } from '../dtos/requests/assign-driver.dto';

@Injectable()
export class VehicleCommandService {
  constructor(
    private readonly vehicleCommandRepository: VehicleCommandRepository,
    private readonly vehicleQueryRepository: VehicleQueryRepository,
    private readonly employeeFacade: EmployeeFacade,
  ) {}

  async createVehicle(
    tenantId: string,
    dto: CreateVehicleDto,
  ): Promise<string> {
    if (
      await this.vehicleQueryRepository.existsByPlateNumber(
        tenantId,
        dto.plateNumber,
      )
    ) {
      throw new DuplicateVehiclePlateException(dto.plateNumber);
    }

    const vehicle = await this.vehicleCommandRepository.create({
      tenantId,
      plateNumber: dto.plateNumber,
      type: dto.type ?? null,
      capacityKg: dto.capacityKg ?? null,
      status: dto.status ?? VehicleStatus.ACTIVE,
    });

    return vehicle.id;
  }

  async updateVehicle(
    tenantId: string,
    id: string,
    dto: UpdateVehicleDto,
  ): Promise<void> {
    const vehicle = await this.vehicleQueryRepository.findById(tenantId, id);

    if (!vehicle) {
      throw new VehicleNotFoundException();
    }

    if (
      dto.plateNumber &&
      dto.plateNumber !== vehicle.plateNumber &&
      (await this.vehicleQueryRepository.existsByPlateNumber(
        tenantId,
        dto.plateNumber,
        id,
      ))
    ) {
      throw new DuplicateVehiclePlateException(dto.plateNumber);
    }

    await this.vehicleCommandRepository.update(id, {
      plateNumber: dto.plateNumber,
      type: dto.type,
      capacityKg: dto.capacityKg,
      status: dto.status,
    });
  }

  /**
   * Assigns a driver to a vehicle.
   *
   * The driver's existence is verified through EmployeeFacade — Fleet never
   * reads the employee table directly.
   *
   * A vehicle may hold at most one active assignment, and a driver may hold at
   * most one active assignment; both are checked against Fleet-owned data.
   */
  @Transactional()
  async assignDriver(
    tenantId: string,
    vehicleId: string,
    dto: AssignDriverDto,
  ): Promise<string> {
    const vehicle = await this.vehicleQueryRepository.findById(
      tenantId,
      vehicleId,
    );

    if (!vehicle) {
      throw new VehicleNotFoundException();
    }

    const driverExists = await this.employeeFacade.validateEmployeeExists(
      dto.employeeId,
      tenantId,
    );

    if (!driverExists) {
      throw new DriverNotFoundException();
    }

    const vehicleAssignment =
      await this.vehicleQueryRepository.findActiveAssignmentByVehicle(
        tenantId,
        vehicleId,
      );

    if (vehicleAssignment) {
      throw new VehicleAlreadyAssignedException();
    }

    const driverAssignment =
      await this.vehicleQueryRepository.findActiveAssignmentByEmployee(
        tenantId,
        dto.employeeId,
      );

    if (driverAssignment) {
      throw new DriverAlreadyAssignedException();
    }

    const assignment = await this.vehicleCommandRepository.createAssignment({
      tenantId,
      employeeId: dto.employeeId,
      vehicleId,
    });

    return assignment.id;
  }

  /**
   * Releases an active driver assignment. Already-released assignments are
   * rejected so the release timestamp is never overwritten.
   */
  async releaseAssignment(
    tenantId: string,
    vehicleId: string,
    assignmentId: string,
  ): Promise<void> {
    const assignment = await this.vehicleQueryRepository.findAssignmentById(
      tenantId,
      assignmentId,
    );

    if (!assignment || assignment.vehicleId !== vehicleId) {
      throw new VehicleAssignmentNotFoundException();
    }

    if (!assignment.isCurrentlyAssigned()) {
      throw new VehicleAssignmentNotFoundException();
    }

    await this.vehicleCommandRepository.releaseAssignment(assignmentId);
  }
}
