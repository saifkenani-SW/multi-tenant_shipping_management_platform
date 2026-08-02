import { Vehicle } from '../../domain/entities/vehicle.entity';
import { VehicleStatus } from '../../domain/enums/vehicle-status.enum';
import { VehicleType } from '../../domain/enums/vehicle-type.enum';
import { DuplicateVehiclePlateException } from '../../domain/exceptions/duplicate-vehicle-plate.exception';
import { MissingTenantContextException } from '../../domain/exceptions/missing-tenant-context.exception';
import { VehicleNotFoundException } from '../../domain/exceptions/vehicle-not-found.exception';
import { VehicleCommandRepository } from '../../infrastructure/repositories/vehicle-command.repository';
import { VehicleQueryRepository } from '../../infrastructure/repositories/vehicle-query.repository';
import { RequestContextService } from '../../../../packages/context/services/request-context.service';
import { VehicleCommandService } from './vehicle-command.service';

describe('VehicleCommandService', () => {
  const tenantId = '01910b80-6e42-7000-8000-000000000000';
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

  const commandRepository = {
    create: jest.fn(),
    update: jest.fn(),
  };
  const queryRepository = {
    existsByPlateNumber: jest.fn(),
    findById: jest.fn(),
  };
  const requestContext = {
    getPrincipal: jest.fn(),
  };

  let service: VehicleCommandService;

  beforeEach(() => {
    jest.resetAllMocks();
    requestContext.getPrincipal.mockReturnValue({ tenantId });
    service = new VehicleCommandService(
      commandRepository as unknown as VehicleCommandRepository,
      queryRepository as unknown as VehicleQueryRepository,
      requestContext as unknown as RequestContextService,
    );
  });

  it('validates plate uniqueness before persisting a vehicle', async () => {
    queryRepository.existsByPlateNumber.mockResolvedValue(false);
    commandRepository.create.mockResolvedValue(vehicle);

    await expect(
      service.createVehicle({
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
      service.createVehicle({ plateNumber: vehicle.plateNumber }),
    ).rejects.toBeInstanceOf(DuplicateVehiclePlateException);

    expect(commandRepository.create).not.toHaveBeenCalled();
  });

  it('uses a tenant-scoped read before updating a vehicle', async () => {
    queryRepository.findById.mockResolvedValue(vehicle);
    queryRepository.existsByPlateNumber.mockResolvedValue(false);

    await service.updateVehicle(vehicle.id, {
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
      service.updateVehicle(vehicle.id, { status: VehicleStatus.INACTIVE }),
    ).rejects.toBeInstanceOf(VehicleNotFoundException);

    expect(commandRepository.update).not.toHaveBeenCalled();
  });

  it('requires a tenant context for writes', async () => {
    requestContext.getPrincipal.mockReturnValue(undefined);

    await expect(
      service.createVehicle({ plateNumber: vehicle.plateNumber }),
    ).rejects.toBeInstanceOf(MissingTenantContextException);

    expect(queryRepository.existsByPlateNumber).not.toHaveBeenCalled();
  });
});
