import { Principal } from '../principal/principal/Principal';

export interface RequestContext {
  requestId: string;
  correlationId?: string;
  traceId?: string;
  principal?: Principal;

  metadata?: Record<string, unknown>;
}
