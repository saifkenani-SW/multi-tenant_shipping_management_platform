import { Vehicle } from '../../domain/entities/vehicle.entity';
import { VehicleAssignment } from '../../domain/entities/vehicle-assignment.entity';
import { VehicleStatus } from '../../domain/enums/vehicle-status.enum';
import { VehicleType } from '../../domain/enums/vehicle-type.enum';
import { DuplicateVehiclePlateException } from '../../domain/exceptions/duplicate-vehicle-plate.exception';
import { VehicleNotFoundException } from '../../domain/exceptions/vehicle-not-found.exception';
import { DriverNotFoundException } from '../../domain/exceptions/driver-not-found.exception';
import { DriverAlreadyAssignedException } from '../../domain/exceptions/driver-already-assigned.exception';
import { VehicleAlreadyAssignedException } from '../../domain/exceptions/vehicle-already-assigned.exception';
import { VehicleAssignmentNotFoundException } from '../../domain/exceptions/vehicle-assignment-not-found.exception';
import { VehicleCommandRepository } from '../../infrastructure/repositories/vehicle-command.repository';
import { VehicleQueryRepository } from '../../infrastructure/repositories/vehicle-query.repository';
import { EmployeeFacade } from '../../../../employee2/facades/employee.facade';
import { VehicleCommandService } from './vehicle-command.service';
import { installTransactionTestContainer } from '../../../../../packages/transaction/testing/transaction-test-container';

describe('VehicleCommandService', () => {
  const tenantId = '01910b80-6e42-7000-8000-000000000000';
  const employeeId = '01910b80-6e42-7000-8000-00000000000a';

  const vehicle = new Vehicle(
    '01910b80-6e42-7000-8000-000000000001',
    tenantId,
    'DAM-12345',
    VehicleType.VAN,
    1250,
    VehicleStatus.ACTIVE,
    new Date('2026-01-01T00:00:00.000Z'),
    new Date('2026-01-01T00:00:00.000Z'),
  );

  const activeAssignment = new VehicleAssignment(
    '01910b80-6e42-7000-8000-00000000000b',
    tenantId,
    employeeId,
    vehicle.id,
    true,
    new Date('2026-01-01T00:00:00.000Z'),
    null,
  );

  const commandRepository = {
    create: jest.fn(),
    update: jest.fn(),
    createAssignment: jest.fn(),
    releaseAssignment: jest.fn(),
  };
  const queryRepository = {
    existsByPlateNumber: jest.fn(),
    findById: jest.fn(),
    findAssignmentById: jest.fn(),
    findActiveAssignmentByVehicle: jest.fn(),
    findActiveAssignmentByEmployee: jest.fn(),
  };
  const employeeFacade = {
    validateEmployeeExists: jest.fn(),
  };

  let service: VehicleCommandService;

  beforeAll(() => {
    installTransactionTestContainer();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    service = new VehicleCommandService(
      commandRepository as unknown as VehicleCommandRepository,
      queryRepository as unknown as VehicleQueryRepository,
      employeeFacade as unknown as EmployeeFacade,
    );
  });

  it('validates plate uniqueness before persisting a vehicle', async () => {
    queryRepository.existsByPlateNumber.mockResolvedValue(false);
    commandRepository.create.mockResolvedValue(vehicle);

    await expect(
      service.createVehicle(tenantId, {
        plateNumber: vehicle.plateNumber,
        type: VehicleType.VAN,
        capacityKg: 1250,
      }),
    ).resolves.toBe(vehicle.id);

    expect(queryRepository.existsByPlateNumber).toHaveBeenCalledWith(
      tenantId,
      vehicle.plateNumber,
    );
    expect(commandRepository.create).toHaveBeenCalledWith({
      tenantId,
      plateNumber: vehicle.plateNumber,
      type: VehicleType.VAN,
      capacityKg: 1250,
      status: VehicleStatus.ACTIVE,
    });
  });

  it('rejects a duplicate plate number without writing', async () => {
    queryRepository.existsByPlateNumber.mockResolvedValue(true);

    await expect(
      service.createVehicle(tenantId, { plateNumber: vehicle.plateNumber }),
    ).rejects.toBeInstanceOf(DuplicateVehiclePlateException);

    expect(commandRepository.create).not.toHaveBeenCalled();
  });

  it('uses a tenant-scoped read before updating a vehicle', async () => {
    queryRepository.findById.mockResolvedValue(vehicle);
    queryRepository.existsByPlateNumber.mockResolvedValue(false);

    await service.updateVehicle(tenantId, vehicle.id, {
      plateNumber: 'DAM-54321',
      status: VehicleStatus.MAINTENANCE,
    });

    expect(queryRepository.findById).toHaveBeenCalledWith(tenantId, vehicle.id);
    expect(queryRepository.existsByPlateNumber).toHaveBeenCalledWith(
      tenantId,
      'DAM-54321',
      vehicle.id,
    );
    expect(commandRepository.update).toHaveBeenCalledWith(vehicle.id, {
      plateNumber: 'DAM-54321',
      type: undefined,
      capacityKg: undefined,
      status: VehicleStatus.MAINTENANCE,
    });
  });

  it('does not write when the vehicle is outside the current tenant', async () => {
    queryRepository.findById.mockResolvedValue(null);

    await expect(
      service.updateVehicle(tenantId, vehicle.id, {
        status: VehicleStatus.INACTIVE,
      }),
    ).rejects.toBeInstanceOf(VehicleNotFoundException);

    expect(commandRepository.update).not.toHaveBeenCalled();
  });

  describe('assignDriver', () => {
    it('verifies the driver through the employee facade before assigning', async () => {
      queryRepository.findById.mockResolvedValue(vehicle);
      employeeFacade.validateEmployeeExists.mockResolvedValue(true);
      queryRepository.findActiveAssignmentByVehicle.mockResolvedValue(null);
      queryRepository.findActiveAssignmentByEmployee.mockResolvedValue(null);
      commandRepository.createAssignment.mockResolvedValue(activeAssignment);

      await expect(
        service.assignDriver(tenantId, vehicle.id, { employeeId }),
      ).resolves.toBe(activeAssignment.id);

      expect(employeeFacade.validateEmployeeExists).toHaveBeenCalledWith(
        employeeId,
        tenantId,
      );
      expect(commandRepository.createAssignment).toHaveBeenCalledWith({
        tenantId,
        employeeId,
        vehicleId: vehicle.id,
      });
    });

    it('rejects an unknown driver without writing', async () => {
      queryRepository.findById.mockResolvedValue(vehicle);
      employeeFacade.validateEmployeeExists.mockResolvedValue(false);

      await expect(
        service.assignDriver(tenantId, vehicle.id, { employeeId }),
      ).rejects.toBeInstanceOf(DriverNotFoundException);

      expect(commandRepository.createAssignment).not.toHaveBeenCalled();
    });

    it('rejects a vehicle that already has an active driver', async () => {
      queryRepository.findById.mockResolvedValue(vehicle);
      employeeFacade.validateEmployeeExists.mockResolvedValue(true);
      queryRepository.findActiveAssignmentByVehicle.mockResolvedValue(
        activeAssignment,
      );

      await expect(
        service.assignDriver(tenantId, vehicle.id, { employeeId }),
      ).rejects.toBeInstanceOf(VehicleAlreadyAssignedException);

      expect(commandRepository.createAssignment).not.toHaveBeenCalled();
    });

    it('rejects a driver who already holds another vehicle', async () => {
      queryRepository.findById.mockResolvedValue(vehicle);
      employeeFacade.validateEmployeeExists.mockResolvedValue(true);
      queryRepository.findActiveAssignmentByVehicle.mockResolvedValue(null);
      queryRepository.findActiveAssignmentByEmployee.mockResolvedValue(
        activeAssignment,
      );

      await expect(
        service.assignDriver(tenantId, vehicle.id, { employeeId }),
      ).rejects.toBeInstanceOf(DriverAlreadyAssignedException);

      expect(commandRepository.createAssignment).not.toHaveBeenCalled();
    });
  });

  describe('releaseAssignment', () => {
    it('releases an active assignment', async () => {
      queryRepository.findAssignmentById.mockResolvedValue(activeAssignment);

      await service.releaseAssignment(
        tenantId,
        vehicle.id,
        activeAssignment.id,
      );

      expect(commandRepository.releaseAssignment).toHaveBeenCalledWith(
        activeAssignment.id,
      );
    });

    it('refuses to release an assignment belonging to another vehicle', async () => {
      queryRepository.findAssignmentById.mockResolvedValue(activeAssignment);

      await expect(
        service.releaseAssignment(
          tenantId,
          'some-other-vehicle',
          activeAssignment.id,
        ),
      ).rejects.toBeInstanceOf(VehicleAssignmentNotFoundException);

      expect(commandRepository.releaseAssignment).not.toHaveBeenCalled();
    });

    it('refuses to release an already-released assignment', async () => {
      const released = new VehicleAssignment(
        activeAssignment.id,
        tenantId,
        employeeId,
        vehicle.id,
        false,
        new Date('2026-01-01T00:00:00.000Z'),
        new Date('2026-02-01T00:00:00.000Z'),
      );
      queryRepository.findAssignmentById.mockResolvedValue(released);

      await expect(
        service.releaseAssignment(tenantId, vehicle.id, released.id),
      ).rejects.toBeInstanceOf(VehicleAssignmentNotFoundException);

      expect(commandRepository.releaseAssignment).not.toHaveBeenCalled();
    });
  });
});
