import { TransportManifest } from '../../domain/entities/transport-manifest.entity';
import { ManifestItem } from '../../domain/entities/manifest-item.entity';
import { ManifestStatus } from '../../domain/enums/manifest-status.enum';
import { ManifestItemStatus } from '../../domain/enums/manifest-item-status.enum';
import { InvalidManifestRouteException } from '../../domain/exceptions/invalid-manifest-route.exception';
import { InvalidManifestOrgUnitsException } from '../../domain/exceptions/invalid-manifest-org-units.exception';
import { DuplicateManifestParcelException } from '../../domain/exceptions/duplicate-manifest-parcel.exception';
import { ParcelAlreadyInActiveManifestException } from '../../domain/exceptions/parcel-already-in-active-manifest.exception';
import { ManifestNotModifiableException } from '../../domain/exceptions/manifest-not-modifiable.exception';
import { TripAlreadyDepartedException } from '../../domain/exceptions/trip-already-departed.exception';
import { Trip } from '../../../trip/domain/entities/trip.entity';
import { TripStatus } from '../../../trip/domain/enums/trip-status.enum';
import { TransportManifestCommandRepository } from '../../infrastructure/repositories/transport-manifest-command.repository';
import { ManifestQueryService } from './manifest-query.service';
import { TripQueryService } from '../../../trip/application/services/trip-query.service';
import { OrganizationFacade } from '../../../../organization/facades/organization.facade';
import { CustomerShipmentFacade } from '../../../../customer-shipment/facades/customer-shipment.facade';
import { ManifestCommandService } from './manifest-command.service';
import { installTransactionTestContainer } from '../../../../../packages/transaction/testing/transaction-test-container';

describe('ManifestCommandService', () => {
  const tenantId = '01910b80-6e42-7000-8000-000000000000';
  const tripId = '01910b80-6e42-7000-8000-0000000000c1';
  const manifestId = '01910b80-6e42-7000-8000-0000000000d1';
  const itemId = '01910b80-6e42-7000-8000-0000000000e1';
  const parcelId = '01910b80-6e42-7000-8000-0000000000b1';
  const originOrgUnitId = '01910b80-6e42-7000-8000-0000000000f1';
  const destinationOrgUnitId = '01910b80-6e42-7000-8000-0000000000f2';

  const tripWithStatus = (status: TripStatus) =>
    Trip.restore({
      id: tripId,
      tenantId,
      driverId: 'd1',
      vehicleId: null,
      originOrgUnitId,
      destinationOrgUnitId,
      status,
      scheduledAt: null,
      startedAt: null,
      endedAt: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  const manifestWithStatus = (status: ManifestStatus) =>
    TransportManifest.restore({
      id: manifestId,
      tenantId,
      tripId,
      originOrgUnitId,
      destinationOrgUnitId,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  const pendingItem = () =>
    ManifestItem.restore({
      id: itemId,
      manifestId,
      parcelId,
      status: ManifestItemStatus.PENDING_LOAD,
      loadedAt: null,
      unloadedAt: null,
    });

  const commandRepository = {
    create: jest.fn(),
    updateStatus: jest.fn(),
    markTripManifestsInTransit: jest.fn(),
    createItems: jest.fn(),
    updateItemStatus: jest.fn(),
    deleteItem: jest.fn(),
    countItemsByStatus: jest.fn(),
  };
  const manifestQueryService = {
    findManifestOrThrow: jest.fn(),
    findItemOrThrow: jest.fn(),
    existsItemsForParcels: jest.fn(),
    areParcelsInActiveManifest: jest.fn(),
  };
  const tripQueryService = {
    findTripOrThrow: jest.fn(),
  };
  const organizationFacade = {
    validateOrganizationUnitsExist: jest.fn(),
  };
  const customerShipmentFacade = {
    markParcelsReadyForDispatch: jest.fn(),
    markParcelLoadedOnManifest: jest.fn(),
    markParcelUnloadedFromManifest: jest.fn(),
  };
  const queryRepository = {};
  const employeeFacade = {
    validateEmployeeExists: jest.fn(),
  };

  let service: ManifestCommandService;

  beforeAll(() => {
    installTransactionTestContainer();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ManifestCommandService(
      commandRepository as unknown as TransportManifestCommandRepository,
      queryRepository as any,
      manifestQueryService as unknown as ManifestQueryService,
      organizationFacade as unknown as OrganizationFacade,
      employeeFacade as any,
      customerShipmentFacade as unknown as CustomerShipmentFacade,
    );
  });

  const createDto = { tripId, originOrgUnitId, destinationOrgUnitId };

  describe('createManifest', () => {
    it('creates a PENDING manifest for a scheduled trip', async () => {
      tripQueryService.findTripOrThrow.mockResolvedValue(
        tripWithStatus(TripStatus.SCHEDULED),
      );
      organizationFacade.validateOrganizationUnitsExist.mockResolvedValue(true);
      commandRepository.create.mockResolvedValue(
        manifestWithStatus(ManifestStatus.OPEN),
      );

      await expect(service.createManifest(tenantId, undefined, createDto)).resolves.toBe(
        manifestId,
      );

      expect(
        organizationFacade.validateOrganizationUnitsExist,
      ).toHaveBeenCalledWith(tenantId, [originOrgUnitId, destinationOrgUnitId]);
    });

    it('rejects a manifest whose origin equals its destination', async () => {
      await expect(
        service.createManifest(tenantId, undefined, {
          ...createDto,
          destinationOrgUnitId: originOrgUnitId,
        }),
      ).rejects.toBeInstanceOf(InvalidManifestRouteException);

      expect(tripQueryService.findTripOrThrow).not.toHaveBeenCalled();
    });

    it('rejects org units outside the tenant', async () => {
      tripQueryService.findTripOrThrow.mockResolvedValue(
        tripWithStatus(TripStatus.SCHEDULED),
      );
      organizationFacade.validateOrganizationUnitsExist.mockResolvedValue(
        false,
      );

      await expect(
        service.createManifest(tenantId, undefined, createDto),
      ).rejects.toBeInstanceOf(InvalidManifestOrgUnitsException);

      expect(commandRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('addItems', () => {
    it('adds parcels to a pending manifest', async () => {
      manifestQueryService.findManifestOrThrow.mockResolvedValue(
        manifestWithStatus(ManifestStatus.OPEN),
      );
      manifestQueryService.existsItemsForParcels.mockResolvedValue(false);
      manifestQueryService.areParcelsInActiveManifest.mockResolvedValue(false);
      commandRepository.createItems.mockResolvedValue([itemId]);
      customerShipmentFacade.markParcelsReadyForDispatch.mockResolvedValue(undefined);

      await expect(
        service.addItems(tenantId, manifestId, undefined, [parcelId]),
      ).resolves.toEqual([expect.any(String)]);

      expect(commandRepository.createItems).toHaveBeenCalled();
      expect(customerShipmentFacade.markParcelsReadyForDispatch).toHaveBeenCalled();
    });

    it('refuses to add parcels once the manifest is in transit', async () => {
      manifestQueryService.findManifestOrThrow.mockResolvedValue(
        manifestWithStatus(ManifestStatus.IN_TRANSIT),
      );

      await expect(
        service.addItems(tenantId, manifestId, undefined, [parcelId]),
      ).rejects.toBeInstanceOf(ManifestNotModifiableException);

      expect(commandRepository.createItems).not.toHaveBeenCalled();
    });

    it('rejects the same parcel twice on one manifest', async () => {
      manifestQueryService.findManifestOrThrow.mockResolvedValue(
        manifestWithStatus(ManifestStatus.OPEN),
      );
      manifestQueryService.existsItemsForParcels.mockResolvedValue(true);

      await expect(
        service.addItems(tenantId, manifestId, undefined, [parcelId]),
      ).rejects.toBeInstanceOf(DuplicateManifestParcelException);

      expect(commandRepository.createItems).not.toHaveBeenCalled();
    });

    it('rejects a parcel already committed to another active manifest', async () => {
      manifestQueryService.findManifestOrThrow.mockResolvedValue(
        manifestWithStatus(ManifestStatus.OPEN),
      );
      manifestQueryService.existsItemsForParcels.mockResolvedValue(false);
      manifestQueryService.areParcelsInActiveManifest.mockResolvedValue(true);

      await expect(
        service.addItems(tenantId, manifestId, undefined, [parcelId]),
      ).rejects.toBeInstanceOf(ParcelAlreadyInActiveManifestException);

      expect(commandRepository.createItems).not.toHaveBeenCalled();
    });
  });

  describe('updateItemStatus', () => {
    it('records a load with its timestamp and may change manifest status', async () => {
      manifestQueryService.findManifestOrThrow.mockResolvedValue(
        manifestWithStatus(ManifestStatus.ASSIGNED),
      );
      manifestQueryService.findItemOrThrow.mockResolvedValue(pendingItem());
      commandRepository.countItemsByStatus.mockResolvedValue(1); // Not all loaded

      await service.updateItemStatus(tenantId, manifestId, itemId, {
        status: ManifestItemStatus.LOADED,
      });

      const anyDate = expect.any(Date) as unknown as Date;
      expect(commandRepository.updateItemStatus).toHaveBeenCalledWith(
        itemId,
        ManifestItemStatus.LOADED,
        { loadedAt: anyDate, unloadedAt: null },
      );
      expect(customerShipmentFacade.markParcelLoadedOnManifest).toHaveBeenCalledWith(
        parcelId,
        tripId,
      );
    });

    it('refuses an illegal transition decided by the item entity', async () => {
      manifestQueryService.findManifestOrThrow.mockResolvedValue(
        manifestWithStatus(ManifestStatus.IN_TRANSIT),
      );
      manifestQueryService.findItemOrThrow.mockResolvedValue(pendingItem());

      await expect(
        service.updateItemStatus(tenantId, manifestId, itemId, {
          status: ManifestItemStatus.UNLOADED,
        }),
      ).rejects.toThrow();

      expect(commandRepository.updateItemStatus).not.toHaveBeenCalled();
    });
  });

  describe('removeItem', () => {
    it('refuses to remove a parcel from an in-transit manifest', async () => {
      manifestQueryService.findManifestOrThrow.mockResolvedValue(
        manifestWithStatus(ManifestStatus.IN_TRANSIT),
      );

      await expect(
        service.removeItem(tenantId, manifestId, itemId, undefined),
      ).rejects.toBeInstanceOf(ManifestNotModifiableException);

      expect(commandRepository.deleteItem).not.toHaveBeenCalled();
    });
  });
});
