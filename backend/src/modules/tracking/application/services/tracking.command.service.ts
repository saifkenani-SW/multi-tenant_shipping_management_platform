import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { TrackingCommandRepository } from '../../infrastructure/repositories/tracking.command.repository';
import { AppendParcelMovementCommand } from '../commands/append-parcel-movement.command';
import {
  PARCEL_MOVEMENT_APPENDED,
  ParcelMovementAppendedPayload,
} from '../../events/parcel-movement-appended.event';

@Injectable()
export class TrackingCommandService {
  private readonly logger = new Logger(TrackingCommandService.name);

  constructor(
    private readonly repository: TrackingCommandRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async appendMovement(command: AppendParcelMovementCommand): Promise<void> {
    this.logger.debug(
      `Appending parcel movement for parcel ${command.parcelId} with action ${command.actionType}`,
    );

    const movement = await this.repository.appendMovement(command);

    if (command.tripId) {
      const payload: ParcelMovementAppendedPayload = {
        tripId: command.tripId,
        movement: movement as Record<string, unknown>,
      };

      this.eventEmitter.emit(PARCEL_MOVEMENT_APPENDED, payload);
    }
  }

  async appendMovements(commands: AppendParcelMovementCommand[]): Promise<void> {
    if (commands.length === 0) return;

    this.logger.debug(`Appending ${commands.length} parcel movements in bulk`);

    await this.repository.appendMovements(commands);

    for (const command of commands) {
      if (command.tripId) {
        const payload: ParcelMovementAppendedPayload = {
          tripId: command.tripId,
          movement: command as unknown as Record<string, unknown>,
        };

        this.eventEmitter.emit(PARCEL_MOVEMENT_APPENDED, payload);
      }
    }
  }
}
