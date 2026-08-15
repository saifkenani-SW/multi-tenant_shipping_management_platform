import { WsException } from '@nestjs/websockets';
import { TripStatus } from '@prisma/client';

import { TrackingGateway } from './tracking.gateway';
import { SubjectType } from '../../../../packages/context/principal/principal/SubjectType';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TRIP_ID   = 'trip-uuid-1';
const DRIVER_ID = 'driver-uuid-1';
const TENANT_ID = 'tenant-uuid-1';

const makeDriverPrincipal = (overrides: { tenantId?: string; profileId?: string } = {}) => ({
  subject: { id: 'user-1', type: SubjectType.DRIVER },
  tenantId: TENANT_ID,
  profileId: DRIVER_ID,
  vehicleId: 'vehicle-1',
  branches: [],
  warehouses: [],
  ...overrides,  // spread last so undefined values explicitly override defaults
});

const makeInProgressTrip = (overrides: Partial<{ driverId: string; status: TripStatus }> = {}) => ({
  id: TRIP_ID,
  tenantId: TENANT_ID,
  driverId: overrides.driverId ?? DRIVER_ID,
  vehicleId: 'vehicle-1',
  originOrgUnitId: 'org-1',
  destinationOrgUnitId: 'org-2',
  status: overrides.status ?? TripStatus.IN_PROGRESS,
  scheduledAt: null,
  startedAt: new Date(),
  endedAt: null,
  notes: null,
  createdByEmployeeId: null,
  createdByEmployeeName: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const makeSocketMock = () => ({
  id: 'socket-1',
  join: jest.fn().mockResolvedValue(undefined),
  handshake: { auth: { token: 'test-token' } },
});

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockCustomerShipmentFacade = {} as any;

const mockFleetFacade = {
  getTripDetails: jest.fn(),
};

const mockRequestContextService = {
  getPrincipal: jest.fn(),
};

const mockLocationFlusher = {
  buffer: jest.fn().mockResolvedValue(undefined),
};

// ── Server mock ───────────────────────────────────────────────────────────────

const mockServerEmit = jest.fn();
const mockServerTo   = jest.fn().mockReturnValue({ emit: mockServerEmit });

// ─────────────────────────────────────────────────────────────────────────────

describe('TrackingGateway — handleDriverLocation()', () => {
  let gateway: TrackingGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServerTo.mockReturnValue({ emit: mockServerEmit });

    // Direct instantiation — avoids NestJS DI scanning @UseInterceptors metadata
    gateway = new TrackingGateway(
      mockCustomerShipmentFacade,
      mockFleetFacade as any,
      mockRequestContextService as any,
      mockLocationFlusher as any,
    );

    // Inject the mocked WebSocket server
    (gateway as any).server = { to: mockServerTo };
  });

  const validPayload = {
    tripId: TRIP_ID,
    latitude: 24.7136,
    longitude: 46.6753,
  };

  // ── Happy path ─────────────────────────────────────────────────────────────

  it('buffers location in Redis and broadcasts to trip room on success', async () => {
    mockRequestContextService.getPrincipal.mockReturnValue(makeDriverPrincipal());
    mockFleetFacade.getTripDetails.mockResolvedValue(makeInProgressTrip());

    await gateway.handleDriverLocation(makeSocketMock() as any, validPayload);

    // 1. Redis buffer was called with correct data
    expect(mockLocationFlusher.buffer).toHaveBeenCalledWith(
      expect.objectContaining({
        tripId:    TRIP_ID,
        driverId:  DRIVER_ID,
        latitude:  24.7136,
        longitude: 46.6753,
        recordedAt: expect.any(Date),
      }),
    );

    // 2. Broadcast fired to the correct room
    expect(mockServerTo).toHaveBeenCalledWith(`trip:${TRIP_ID}`);
    expect(mockServerEmit).toHaveBeenCalledWith(
      'driver_location',
      expect.objectContaining({
        driverId:  DRIVER_ID,
        latitude:  24.7136,
        longitude: 46.6753,
        recordedAt: expect.any(String),
      }),
    );
  });

  it('passes tenantId from principal to FleetFacade.getTripDetails', async () => {
    mockRequestContextService.getPrincipal.mockReturnValue(makeDriverPrincipal());
    mockFleetFacade.getTripDetails.mockResolvedValue(makeInProgressTrip());

    await gateway.handleDriverLocation(makeSocketMock() as any, validPayload);

    expect(mockFleetFacade.getTripDetails).toHaveBeenCalledWith(TENANT_ID, TRIP_ID);
  });

  it('joins the driver to the trip room', async () => {
    mockRequestContextService.getPrincipal.mockReturnValue(makeDriverPrincipal());
    mockFleetFacade.getTripDetails.mockResolvedValue(makeInProgressTrip());

    const client = makeSocketMock();
    await gateway.handleDriverLocation(client as any, validPayload);

    expect(client.join).toHaveBeenCalledWith(`trip:${TRIP_ID}`);
  });

  // ── Authorization failures ─────────────────────────────────────────────────

  it('throws WsException when principal is a CUSTOMER (not DRIVER)', async () => {
    mockRequestContextService.getPrincipal.mockReturnValue({
      subject: { id: 'user-1', type: SubjectType.CUSTOMER },
      branches: [],
      warehouses: [],
    });

    await expect(
      gateway.handleDriverLocation(makeSocketMock() as any, validPayload),
    ).rejects.toBeInstanceOf(WsException);

    expect(mockLocationFlusher.buffer).not.toHaveBeenCalled();
    expect(mockServerTo).not.toHaveBeenCalled();
  });

  it('throws WsException when principal is an EMPLOYEE (not DRIVER)', async () => {
    mockRequestContextService.getPrincipal.mockReturnValue({
      subject: { id: 'user-1', type: SubjectType.EMPLOYEE },
      tenantId: TENANT_ID,
      profileId: DRIVER_ID,
      branches: [],
      warehouses: [],
    });

    await expect(
      gateway.handleDriverLocation(makeSocketMock() as any, validPayload),
    ).rejects.toBeInstanceOf(WsException);
  });

  it('throws WsException when tenantId is missing from driver context', async () => {
    mockRequestContextService.getPrincipal.mockReturnValue(
      makeDriverPrincipal({ tenantId: undefined }),
    );

    await expect(
      gateway.handleDriverLocation(makeSocketMock() as any, validPayload),
    ).rejects.toBeInstanceOf(WsException);
  });

  it('throws WsException when driverId (profileId) is missing from driver context', async () => {
    mockRequestContextService.getPrincipal.mockReturnValue(
      makeDriverPrincipal({ profileId: undefined }),
    );

    await expect(
      gateway.handleDriverLocation(makeSocketMock() as any, validPayload),
    ).rejects.toBeInstanceOf(WsException);
  });

  it('throws WsException when trip status is SCHEDULED (not IN_PROGRESS)', async () => {
    mockRequestContextService.getPrincipal.mockReturnValue(makeDriverPrincipal());
    mockFleetFacade.getTripDetails.mockResolvedValue(
      makeInProgressTrip({ status: TripStatus.SCHEDULED }),
    );

    await expect(
      gateway.handleDriverLocation(makeSocketMock() as any, validPayload),
    ).rejects.toBeInstanceOf(WsException);

    expect(mockLocationFlusher.buffer).not.toHaveBeenCalled();
  });

  it('throws WsException when trip is COMPLETED', async () => {
    mockRequestContextService.getPrincipal.mockReturnValue(makeDriverPrincipal());
    mockFleetFacade.getTripDetails.mockResolvedValue(
      makeInProgressTrip({ status: TripStatus.COMPLETED }),
    );

    await expect(
      gateway.handleDriverLocation(makeSocketMock() as any, validPayload),
    ).rejects.toBeInstanceOf(WsException);
  });

  it('throws WsException when trip is CANCELLED', async () => {
    mockRequestContextService.getPrincipal.mockReturnValue(makeDriverPrincipal());
    mockFleetFacade.getTripDetails.mockResolvedValue(
      makeInProgressTrip({ status: TripStatus.CANCELLED }),
    );

    await expect(
      gateway.handleDriverLocation(makeSocketMock() as any, validPayload),
    ).rejects.toBeInstanceOf(WsException);
  });

  it('throws WsException when driver is not the assigned driver for this trip', async () => {
    mockRequestContextService.getPrincipal.mockReturnValue(makeDriverPrincipal());
    mockFleetFacade.getTripDetails.mockResolvedValue(
      makeInProgressTrip({ driverId: 'another-driver-uuid' }),
    );

    await expect(
      gateway.handleDriverLocation(makeSocketMock() as any, validPayload),
    ).rejects.toBeInstanceOf(WsException);

    expect(mockLocationFlusher.buffer).not.toHaveBeenCalled();
    expect(mockServerTo).not.toHaveBeenCalled();
  });
});
