import { Trip } from '../../domain/entities/trip.entity';
import { TripStatus } from '../../domain/enums/trip-status.enum';
import { InvalidTripRouteException } from '../../domain/exceptions/invalid-trip-route.exception';
import { InvalidTripOrgUnitsException } from '../../domain/exceptions/invalid-trip-org-units.exception';
import { TripCannotStartWithoutManifestException } from '../../domain/exceptions/trip-cannot-start-without-manifest.exception';
import { DriverNotFoundException } from '../../../vehicle/domain/exceptions/driver-not-found.exception';
import { VehicleNotOperableException } from '../../../vehicle/domain/exceptions/vehicle-not-operable.exception';
import { Vehicle } from '../../../vehicle/domain/entities/vehicle.entity';
import { VehicleStatus } from '../../../vehicle/domain/enums/vehicle-status.enum';
import { VehicleType } from '../../../vehicle/domain/enums/vehicle-type.enum';
import { TripCommandRepository } from '../../infrastructure/repositories/trip-command.repository';
import { TripQueryService } from './trip-query.service';
import { ManifestCommandService } from '../../../transport_manifest/application/services/manifest-command.service';
import { VehicleQueryService } from '../../../vehicle/application/services/vehicle-query.service';
import { EmployeeFacade } from '../../../../employee2/facades/employee.facade';
import { NotificationFacade } from '../../../../notification/facades/notification.facade';
import { OrganizationFacade } from '../../../../organization/facades/organization.facade';
import { NotificationType } from '../../../../../packages/firebase-notifications';
import { TripCommandService } from './trip-command.service';
import { installTransactionTestContainer } from '../../../../../packages/transaction/testing/transaction-test-container';

describe('TripCommandService', () => {
  const tenantId = '01910b80-6e42-7000-8000-000000000000';
  const driverId = '01910b80-6e42-7000-8000-00000000000a';
  const vehicleId = '01910b80-6e42-7000-8000-000000000001';
  const originOrgUnitId = '01910b80-6e42-7000-8000-0000000000f1';
  const destinationOrgUnitId = '01910b80-6e42-7000-8000-0000000000f2';
  const tripId = '01910b80-6e42-7000-8000-0000000000c1';

  const activeVehicle = new Vehicle(
    vehicleId,
    tenantId,
    'DAM-12345',
    VehicleType.VAN,
    1250,
    VehicleStatus.ACTIVE,
    new Date(),
    new Date(),
  );

  const maintenanceVehicle = new Vehicle(
    vehicleId,
    tenantId,
    'DAM-12345',
    VehicleType.VAN,
    1250,
    VehicleStatus.MAINTENANCE,
    new Date(),
    new Date(),
  );

  const scheduledTrip = () =>
    Trip.restore({
      id: tripId,
      tenantId,
      driverId,
      vehicleId,
      originOrgUnitId,
      destinationOrgUnitId,
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

  const validDto = {
    driverId,
    vehicleId,
    originOrgUnitId,
    destinationOrgUnitId,
  };

  const commandRepository = {
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
  };
  const tripQueryService = {
    findTripOrThrow: jest.fn(),
    countManifests: jest.fn(),
  };
  const manifestCommandService = {
    markTripManifestsInTransit: jest.fn(),
  };
  const vehicleQueryService = {
    findVehicleOrThrow: jest.fn(),
  };
  const employeeFacade = {
    validateEmployeeExists: jest.fn(),
    getUserId: jest.fn(),
  };
  const organizationFacade = {
    validateOrganizationUnitsExist: jest.fn(),
  };
  const notificationFacade = {
    notifyUser: jest.fn(),
  };

  let service: TripCommandService;

  beforeAll(() => {
    installTransactionTestContainer();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    service = new TripCommandService(
      commandRepository as unknown as TripCommandRepository,
      tripQueryService as unknown as TripQueryService,
      manifestCommandService as unknown as ManifestCommandService,
      vehicleQueryService as unknown as VehicleQueryService,
      employeeFacade as unknown as EmployeeFacade,
      organizationFacade as unknown as OrganizationFacade,
      notificationFacade as unknown as NotificationFacade,
    );
  });

  describe('createTrip', () => {
    it('validates driver and org units through facades, then persists', async () => {
      employeeFacade.validateEmployeeExists.mockResolvedValue(true);
      organizationFacade.validateOrganizationUnitsExist.mockResolvedValue(true);
      vehicleQueryService.findVehicleOrThrow.mockResolvedValue(activeVehicle);
      commandRepository.create.mockResolvedValue(scheduledTrip());

      await expect(service.createTrip(tenantId, undefined, validDto)).resolves.toBe(
        tripId,
      );

      expect(employeeFacade.validateEmployeeExists).toHaveBeenCalledWith(
        driverId,
        tenantId,
      );
      expect(
        organizationFacade.validateOrganizationUnitsExist,
      ).toHaveBeenCalledWith(tenantId, [originOrgUnitId, destinationOrgUnitId]);
      expect(commandRepository.create).toHaveBeenCalled();
    });

    it('rejects a trip whose origin equals its destination before any lookup', async () => {
      await expect(
        service.createTrip(tenantId, undefined, {
          ...validDto,
          destinationOrgUnitId: originOrgUnitId,
        }),
      ).rejects.toBeInstanceOf(InvalidTripRouteException);

      expect(employeeFacade.validateEmployeeExists).not.toHaveBeenCalled();
      expect(commandRepository.create).not.toHaveBeenCalled();
    });

    it('rejects an unknown driver without writing', async () => {
      employeeFacade.validateEmployeeExists.mockResolvedValue(false);

      await expect(
        service.createTrip(tenantId, undefined, validDto),
      ).rejects.toBeInstanceOf(DriverNotFoundException);

      expect(commandRepository.create).not.toHaveBeenCalled();
    });

    it('rejects org units outside the tenant without writing', async () => {
      employeeFacade.validateEmployeeExists.mockResolvedValue(true);
      organizationFacade.validateOrganizationUnitsExist.mockResolvedValue(
        false,
      );

      await expect(
        service.createTrip(tenantId, undefined, validDto),
      ).rejects.toBeInstanceOf(InvalidTripOrgUnitsException);

      expect(commandRepository.create).not.toHaveBeenCalled();
    });

    it('rejects a vehicle that is not ACTIVE', async () => {
      employeeFacade.validateEmployeeExists.mockResolvedValue(true);
      organizationFacade.validateOrganizationUnitsExist.mockResolvedValue(true);
      vehicleQueryService.findVehicleOrThrow.mockResolvedValue(
        maintenanceVehicle,
      );

      await expect(
        service.createTrip(tenantId, undefined, validDto),
      ).rejects.toBeInstanceOf(VehicleNotOperableException);

      expect(commandRepository.create).not.toHaveBeenCalled();
    });

    it('skips the vehicle check when no vehicle is supplied', async () => {
      employeeFacade.validateEmployeeExists.mockResolvedValue(true);
      organizationFacade.validateOrganizationUnitsExist.mockResolvedValue(true);
      commandRepository.create.mockResolvedValue(scheduledTrip());

      await service.createTrip(tenantId, undefined, {
        driverId,
        originOrgUnitId,
        destinationOrgUnitId,
      });

      expect(vehicleQueryService.findVehicleOrThrow).not.toHaveBeenCalled();
    });

    it('notifies the assigned driver once the trip exists', async () => {
      const userId = '01910b80-6e42-7000-8000-0000000000e1';
      employeeFacade.validateEmployeeExists.mockResolvedValue(true);
      organizationFacade.validateOrganizationUnitsExist.mockResolvedValue(true);
      vehicleQueryService.findVehicleOrThrow.mockResolvedValue(activeVehicle);
      commandRepository.create.mockResolvedValue(scheduledTrip());
      employeeFacade.getUserId.mockResolvedValue(userId);

      await service.createTrip(tenantId, undefined, validDto);

      expect(employeeFacade.getUserId).toHaveBeenCalledWith(driverId, tenantId);
      expect(notificationFacade.notifyUser).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          data: { type: NotificationType.TRIP_ASSIGNED, tripId },
        }),
      );
    });

    it('does not notify when the trip was never created', async () => {
      employeeFacade.validateEmployeeExists.mockResolvedValue(false);

      await expect(
        service.createTrip(tenantId, undefined, validDto),
      ).rejects.toBeInstanceOf(DriverNotFoundException);

      expect(notificationFacade.notifyUser).not.toHaveBeenCalled();
    });

    it('still creates the trip when the driver has no user account', async () => {
      employeeFacade.validateEmployeeExists.mockResolvedValue(true);
      organizationFacade.validateOrganizationUnitsExist.mockResolvedValue(true);
      vehicleQueryService.findVehicleOrThrow.mockResolvedValue(activeVehicle);
      commandRepository.create.mockResolvedValue(scheduledTrip());
      employeeFacade.getUserId.mockResolvedValue(null);

      await expect(service.createTrip(tenantId, undefined, validDto)).resolves.toBe(
        tripId,
      );

      expect(notificationFacade.notifyUser).not.toHaveBeenCalled();
    });
  });

  describe('updateTrip', () => {
    const newDriverId = '01910b80-6e42-7000-8000-00000000000b';

    it('notifies the new driver when the trip changes hands', async () => {
      const userId = '01910b80-6e42-7000-8000-0000000000e2';
      tripQueryService.findTripOrThrow.mockResolvedValue(scheduledTrip());
      employeeFacade.validateEmployeeExists.mockResolvedValue(true);
      employeeFacade.getUserId.mockResolvedValue(userId);

      await service.updateTrip(tenantId, tripId, { driverId: newDriverId });

      expect(employeeFacade.getUserId).toHaveBeenCalledWith(
        newDriverId,
        tenantId,
      );
      expect(notificationFacade.notifyUser).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          data: { type: NotificationType.TRIP_ASSIGNED, tripId },
        }),
      );
    });

    it('stays silent when the driver is unchanged', async () => {
      tripQueryService.findTripOrThrow.mockResolvedValue(scheduledTrip());

      await service.updateTrip(tenantId, tripId, { notes: 'حمولة مبرّدة' });

      expect(notificationFacade.notifyUser).not.toHaveBeenCalled();
    });
  });

  describe('startTrip', () => {
    it('refuses to start a trip with no manifests', async () => {
      tripQueryService.findTripOrThrow.mockResolvedValue(scheduledTrip());
      tripQueryService.countManifests.mockResolvedValue(0);

      await expect(service.startTrip(tenantId, tripId)).rejects.toBeInstanceOf(
        TripCannotStartWithoutManifestException,
      );

      expect(commandRepository.updateStatus).not.toHaveBeenCalled();
      expect(
        manifestCommandService.markTripManifestsInTransit,
      ).not.toHaveBeenCalled();
    });

    it('starts the trip and carries its manifests into transit', async () => {
      tripQueryService.findTripOrThrow.mockResolvedValue(scheduledTrip());
      tripQueryService.countManifests.mockResolvedValue(2);

      await service.startTrip(tenantId, tripId);

      const anyDate = expect.any(Date) as unknown as Date;
      expect(commandRepository.updateStatus).toHaveBeenCalledWith(
        tripId,
        TripStatus.IN_PROGRESS,
        { startedAt: anyDate },
      );
      expect(
        manifestCommandService.markTripManifestsInTransit,
      ).toHaveBeenCalledWith(tenantId, tripId);
    });
  });
});
