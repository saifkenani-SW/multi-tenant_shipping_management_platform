import { Injectable } from '@nestjs/common';
import { TrackingQueryRepository } from '../../infrastructure/repositories/tracking.query.repository';

@Injectable()
export class TrackingQueryService {
  constructor(private readonly repository: TrackingQueryRepository) {}

  async getParcelHistory(parcelId: string) {
    return this.repository.getParcelHistory(parcelId);
  }
}
