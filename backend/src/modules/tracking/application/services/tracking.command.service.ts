import { Injectable, Logger } from '@nestjs/common';
import { TrackingCommandRepository } from '../../infrastructure/repositories/tracking.command.repository';
import { AppendParcelMovementCommand } from '../commands/append-parcel-movement.command';

@Injectable()
export class TrackingCommandService {
  private readonly logger = new Logger(TrackingCommandService.name);

  constructor(private readonly repository: TrackingCommandRepository) {}

  async appendMovement(command: AppendParcelMovementCommand): Promise<void> {
    this.logger.debug(`Appending parcel movement for parcel ${command.parcelId} with action ${command.actionType}`);
    await this.repository.appendMovement(command);
  }
}
