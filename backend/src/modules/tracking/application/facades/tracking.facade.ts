import { Injectable } from '@nestjs/common';
import { TrackingCommandService } from '../services/tracking.command.service';
import { AppendParcelMovementCommand } from '../commands/append-parcel-movement.command';

@Injectable()
export class TrackingFacade {
  constructor(private readonly commandService: TrackingCommandService) {}

  async appendMovement(command: AppendParcelMovementCommand): Promise<void> {
    await this.commandService.appendMovement(command);
  }
}
