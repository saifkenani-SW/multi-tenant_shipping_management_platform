import { Injectable } from '@nestjs/common';

import { PodAction } from '../../../actions/pod.action';
import { PodAuthorizationStrategy } from '../interfaces/pod-authorization-strategy.interface';

import { RecordPodStrategy } from '../record-pod.strategy';
import { ViewPodStrategy } from '../view-pod.strategy';

@Injectable()
export class PodStrategyRegistry {
  private readonly strategies = new Map<PodAction, PodAuthorizationStrategy>();

  constructor(
    recordStrategy: RecordPodStrategy,
    viewStrategy: ViewPodStrategy,
  ) {
    this.strategies.set(recordStrategy.action, recordStrategy);
    this.strategies.set(viewStrategy.action, viewStrategy);
  }

  get<TPayload = unknown>(
    action: PodAction,
  ): PodAuthorizationStrategy<TPayload> {
    const strategy = this.strategies.get(action);

    if (!strategy) {
      throw new Error(
        `No authorization strategy registered for action "${action}".`,
      );
    }

    return strategy;
  }
}
