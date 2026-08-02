import { Injectable } from '@nestjs/common';
import { TrackingCommandService } from '../services/tracking.command.service';
import { AppendParcelMovementCommand } from '../commands/append-parcel-movement.command';
import { TrackingQueryService } from '../services/tracking.query.service';

@Injectable()
export class TrackingFacade {
  constructor(
    private readonly commandService: TrackingCommandService,
    private readonly queryService: TrackingQueryService,
  ) {}

  async appendMovement(command: AppendParcelMovementCommand): Promise<void> {
    await this.commandService.appendMovement(command);
  }

  async getParcelHistory(parcelId: string) {
    return this.queryService.getParcelHistory(parcelId);
  }
}
