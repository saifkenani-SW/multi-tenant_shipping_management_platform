import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';

import { ActionType, ParcelStatus } from '@prisma/client';

import { TrackingCommandService } from './tracking.command.service';
import { TrackingCommandRepository } from '../../infrastructure/repositories/tracking.command.repository';
import {
  PARCEL_MOVEMENT_APPENDED,
  ParcelMovementAppendedPayload,
} from '../../events/parcel-movement-appended.event';
import { AppendParcelMovementCommand } from '../commands/append-parcel-movement.command';

const mockMovement = {
  id: 'mov-1',
  tenant_id: 'tenant-1',
  parcel_id: 'parcel-1',
  trip_id: 'trip-1',
  action_type: ActionType.LOADED_ON_TRIP,
  previous_status: ParcelStatus.AT_WAREHOUSE,
  new_status: ParcelStatus.IN_TRANSIT,
  created_at: new Date(),
};

describe('TrackingCommandService', () => {
  let service: TrackingCommandService;
  let repository: jest.Mocked<TrackingCommandRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    repository = {
      appendMovement: jest.fn().mockResolvedValue(mockMovement),
    } as any;

    eventEmitter = {
      emit: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingCommandService,
        { provide: TrackingCommandRepository, useValue: repository },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(TrackingCommandService);
  });

  describe('appendMovement()', () => {
    const baseCommand: AppendParcelMovementCommand = {
      tenantId: 'tenant-1',
      parcelId: 'parcel-1',
      actionType: ActionType.LOADED_ON_TRIP,
      previousStatus: ParcelStatus.AT_WAREHOUSE,
      newStatus: ParcelStatus.IN_TRANSIT,
    };

    it('calls repository.appendMovement with the given command', async () => {
      await service.appendMovement({ ...baseCommand, tripId: 'trip-1' });
      expect(repository.appendMovement).toHaveBeenCalledWith(
        expect.objectContaining({ tripId: 'trip-1' }),
      );
    });

    it('emits PARCEL_MOVEMENT_APPENDED when tripId is present', async () => {
      await service.appendMovement({ ...baseCommand, tripId: 'trip-1' });

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        PARCEL_MOVEMENT_APPENDED,
        expect.objectContaining<Partial<ParcelMovementAppendedPayload>>({
          tripId: 'trip-1',
          movement: mockMovement,
        }),
      );
    });

    it('does NOT emit event when tripId is absent', async () => {
      await service.appendMovement(baseCommand); // no tripId
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('does NOT emit event when tripId is undefined', async () => {
      await service.appendMovement({ ...baseCommand, tripId: undefined });
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});
