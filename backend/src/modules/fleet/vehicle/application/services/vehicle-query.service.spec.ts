import { Vehicle } from '../../domain/entities/vehicle.entity';
import { VehicleStatus } from '../../domain/enums/vehicle-status.enum';
import { VehicleType } from '../../domain/enums/vehicle-type.enum';
import { VehicleNotFoundException } from '../../domain/exceptions/vehicle-not-found.exception';
import { VehicleQueryRepository } from '../../infrastructure/repositories/vehicle-query.repository';
import { VehicleQueryCriteriaBuilder } from '../builders/query/vehicle-query-criteria.builder';
import { VehicleResponseMapper } from '../mappers/vehicle-response.mapper';
import { VehicleQueryDto } from '../dtos/requests/vehicle-query.dto';
import { VehicleQueryService } from './vehicle-query.service';

/**
 * A platform owner carries no tenant in the request context, so every read
 * path must accept `undefined` and leave the tenant filter off rather than
 * throwing or silently scoping to nothing.
 */
describe('VehicleQueryService — tenant scoping', () => {
  const tenantId = '01910b80-6e42-7000-8000-000000000000';
  const vehicleId = '01910b80-6e42-7000-8000-000000000001';

  const vehicle = new Vehicle(
    vehicleId,
    tenantId,
    'DAM-12345',
    VehicleType.VAN,
    1250,
    VehicleStatus.ACTIVE,
    new Date(),
    new Date(),
  );

  const queryRepository = {
    findMany: jest.fn(),
    findById: jest.fn(),
    findAssignmentsByVehicle: jest.fn(),
    findActiveAssignmentByEmployee: jest.fn(),
  };

  let service: VehicleQueryService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new VehicleQueryService(
      queryRepository as unknown as VehicleQueryRepository,
      new VehicleQueryCriteriaBuilder(),
      new VehicleResponseMapper(),
    );
  });

  describe('findVehicles', () => {
    it('scopes the criteria to the tenant for a tenant-bound caller', async () => {
      queryRepository.findMany.mockResolvedValue([[vehicle], 1]);

      await service.findVehicles(tenantId, new VehicleQueryDto());

      const [criteria] = queryRepository.findMany.mock.calls[0] as [
        { tenantId: string | undefined },
      ];
      expect(criteria.tenantId).toBe(tenantId);
    });

    it('leaves the criteria unscoped for a platform owner', async () => {
      queryRepository.findMany.mockResolvedValue([[vehicle], 1]);

      await service.findVehicles(undefined, new VehicleQueryDto());

      const [criteria] = queryRepository.findMany.mock.calls[0] as [
        { tenantId: string | undefined },
      ];
      expect(criteria.tenantId).toBeUndefined();
    });
  });

  describe('getVehicleDetails', () => {
    it('reads a vehicle from any tenant for a platform owner', async () => {
      queryRepository.findById.mockResolvedValue(vehicle);

      const result = await service.getVehicleDetails(undefined, vehicleId);

      expect(queryRepository.findById).toHaveBeenCalledWith(
        undefined,
        vehicleId,
      );
      expect(result.id).toBe(vehicleId);
    });

    it('still raises not-found when the vehicle does not exist', async () => {
      queryRepository.findById.mockResolvedValue(null);

      await expect(
        service.getVehicleDetails(undefined, vehicleId),
      ).rejects.toBeInstanceOf(VehicleNotFoundException);
    });
  });

  describe('getVehicleAssignments', () => {
    it('passes the absent tenant through to the repository', async () => {
      queryRepository.findById.mockResolvedValue(vehicle);
      queryRepository.findAssignmentsByVehicle.mockResolvedValue([]);

      await service.getVehicleAssignments(undefined, vehicleId);

      expect(queryRepository.findAssignmentsByVehicle).toHaveBeenCalledWith(
        undefined,
        vehicleId,
      );
    });
  });
});
