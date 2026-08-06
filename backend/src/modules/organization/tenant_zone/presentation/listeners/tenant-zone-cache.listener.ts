import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrganizationUnitChangedEvent } from '../../../organization_unit/domain/events/organization-unit-changed.event';
import type { ICacheFacade } from '../../../../../core/cache/interfaces/ICacheFacade';
import { CACHE_FACADE } from '../../../../../core/cache/tokens/cache.tokens';
import { TENANT_ZONE_CACHE_KEYS } from '../../constants/tenant-zone.cache.constants';

@Injectable()
export class TenantZoneCacheListener {
  private readonly logger = new Logger(TenantZoneCacheListener.name);

  constructor(
    @Inject(CACHE_FACADE) private readonly cacheFacade: ICacheFacade,
  ) {}

  @OnEvent('organization-unit.changed', { async: true })
  async handleOrganizationUnitChangedEvent(
    event: OrganizationUnitChangedEvent,
  ) {
    this.logger.log(
      `Handling organization-unit.changed event for tenant ${event.tenantId}`,
    );
    try {
      if (event.oldZoneId) {
        await this.cacheFacade.evict([
          TENANT_ZONE_CACHE_KEYS.DETAILS,
          event.oldZoneId,
        ]);
      }

      if (event.newZoneId && event.newZoneId !== event.oldZoneId) {
        await this.cacheFacade.evict([
          TENANT_ZONE_CACHE_KEYS.DETAILS,
          event.newZoneId,
        ]);
      }
      /*
      // Evict the list cache for guarantee
      await this.cacheFacade.evict([
        TENANT_ZONE_CACHE_KEYS.LIST,
        event.tenantId,
      ]);*/
    } catch (err) {
      this.logger.error('Failed to evict tenant zone cache', err);
    }
  }
}
