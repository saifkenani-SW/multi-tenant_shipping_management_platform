import { Trip } from '../../domain/entities/trip.entity';
import { TripStatus } from '../../domain/enums/trip-status.enum';
import { TripNotFoundException } from '../../domain/exceptions/trip-not-found.exception';
import { TripQueryRepository } from '../../infrastructure/repositories/trip-query.repository';
import { TripResponseMapper } from '../mappers/trip-response.mapper';
import { TripQueryDto } from '../dtos/requests/trip-query.dto';
import { TripQueryService } from './trip-query.service';

/**
 * A platform owner carries no tenant in the request context, so every read
 * path must accept `undefined` and leave the tenant filter off.
 */
describe('TripQueryService — tenant scoping', () => {
  const tenantId = '01910b80-6e42-7000-8000-000000000000';
  const tripId = '01910b80-6e42-7000-8000-0000000000c1';

  const trip = Trip.restore({
    id: tripId,
    tenantId,
    driverId: '01910b80-6e42-7000-8000-00000000000a',
    vehicleId: null,
    originOrgUnitId: '01910b80-6e42-7000-8000-0000000000f1',
    destinationOrgUnitId: '01910b80-6e42-7000-8000-0000000000f2',
    status: TripStatus.SCHEDULED,
    scheduledAt: null,
    startedAt: null,
    endedAt: null,
    notes: null,
    createdByEmployeeId: null,
    createdByEmployeeName: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const queryRepository = {
    findMany: jest.fn(),
    findById: jest.fn(),
    countManifests: jest.fn(),
  };

  let service: TripQueryService;

  const authFacade = { buildScope: jest.fn().mockReturnValue(null) };

  beforeEach(() => {
    jest.resetAllMocks();
    authFacade.buildScope.mockReturnValue(null);
    service = new TripQueryService(
      queryRepository as unknown as TripQueryRepository,
      new TripResponseMapper(),
      authFacade as any,
      { getEmployeesBasicDetails: jest.fn().mockResolvedValue([]) } as any,
      { getOrganizationUnitsByIds: jest.fn().mockResolvedValue([]) } as any,
      { findVehiclesByIds: jest.fn().mockResolvedValue([]) } as any,
    );
  });

  it('scopes the criteria to the tenant for a tenant-bound caller', async () => {
    queryRepository.findMany.mockResolvedValue([[trip], 1]);

    await service.findTrips(tenantId, new TripQueryDto());

    const [criteria] = queryRepository.findMany.mock.calls[0] as [
      { tenantId: string | undefined },
    ];
    expect(criteria.tenantId).toBe(tenantId);
  });

  it('leaves the criteria unscoped for a platform owner', async () => {
    queryRepository.findMany.mockResolvedValue([[trip], 1]);

    await service.findTrips(undefined, new TripQueryDto());

    const [criteria] = queryRepository.findMany.mock.calls[0] as [
      { tenantId: string | undefined },
    ];
    expect(criteria.tenantId).toBeUndefined();
  });

  it('reads a trip from any tenant for a platform owner', async () => {
    queryRepository.findById.mockResolvedValue(trip);

    const result = await service.getTripDetails(undefined, tripId);

    expect(queryRepository.findById).toHaveBeenCalledWith(undefined, tripId);
    expect(result.id).toBe(tripId);
  });

  it('still raises not-found when the trip does not exist', async () => {
    queryRepository.findById.mockResolvedValue(null);

    await expect(
      service.getTripDetails(undefined, tripId),
    ).rejects.toBeInstanceOf(TripNotFoundException);
  });
});
