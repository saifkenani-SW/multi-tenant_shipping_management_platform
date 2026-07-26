import { AuthorizationContext } from './authorization-context.interface';

export interface CapabilityBuilder<TEntity, TCapability> {
  buildCapabilities(
    entity: TEntity,
    context: AuthorizationContext,
  ): Promise<TCapability> | TCapability;
}
