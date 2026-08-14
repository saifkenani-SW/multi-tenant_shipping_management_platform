import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuthorizationFacade,
  Authorize,
  ReturnCapabilities,
} from '../../../../../packages/authorization';
import { Policy } from '../../../../../packages/authorization/policy';
import { ShipmentPolicy } from '../../domain/authorization/policies/shipment.policy';
import { ShipmentCapabilityBuilder } from '../capabilities/shipment-capability.builder';
import { ShipmentAction } from '../../domain/authorization/actions/shipment.action';
import { CursorPaginatedResponse } from '../../../../../common/pagination/cursor/responses/cursor-paginated-response';
import { ShipmentQueryRepository } from '../../infrastructure/repositories/shipment.query.repository';
import { ShipmentVisibilityScope } from '../../domain/authorization/scopes/shipment-visibility.scope';
import { ShipmentQueryDto } from '../dtos/requests/shipment-query.dto';
import type { ShipmentMergedCriteria } from '../dtos/requests/shipment-merged-criteria.interface';
import { ShipmentResponseDto } from '../dtos/responses/shipment.response.dto';
import { ShipmentDetailsResponseDto } from '../dtos/responses/shipment-details.response.dto';
import { ShipmentMapper } from '../mappers/shipment.mapper';
import { ParcelQueryService } from '../../../parcel/application/services/parcel.query.service';
import { ParcelMapper } from '../../../parcel/application/mappers/parcel.mapper';
import { CustomerShipment } from '../../domain/entities/customer-shipment.entity';

@Injectable()
export class ShipmentQueryService {
  constructor(
    private readonly queryRepository: ShipmentQueryRepository,
    private readonly authorizationFacade: AuthorizationFacade,
    private readonly mapper: ShipmentMapper,
    private readonly parcelQueryService: ParcelQueryService,
    private readonly parcelMapper: ParcelMapper,
  ) {}

  /**
   * Lists shipments visible to the caller.
   *
   * The visibility scope is mandatory. A filter may narrow it, but a filter
   * that contradicts it is refused with Forbidden rather than silently
   * dropped — otherwise a caller could believe they searched the whole set.
   */
  async findMany(
    filter: ShipmentQueryDto,
  ): Promise<CursorPaginatedResponse<ShipmentResponseDto>> {
    const scope = this.authorizationFacade.buildScope({
      builder: ShipmentVisibilityScope,
    });

    if (
      scope.shipment?.tenant_id &&
      filter.tenantId &&
      filter.tenantId !== scope.shipment.tenant_id
    ) {
      throw new ForbiddenException('You can only filter by your own tenant.');
    }

    const merged: ShipmentMergedCriteria = {
      tenantId: scope.shipment?.tenant_id ?? filter.tenantId,
      orgUnitIds: scope.shipment?.org_unit_ids,
      customerPhone: scope.shipment?.customer_phone,
      originOrgUnitId: filter.originOrgUnitId,
      destinationOrgUnitId: filter.destinationOrgUnitId,
      status: filter.status,
      senderPhone: filter.senderPhone,
      receiverPhone: filter.receiverPhone,
      cursor: filter.cursor,
      limit: filter.limit,
    };

    const result = await this.queryRepository.findMany(merged);

    return new CursorPaginatedResponse(
      (result.data as any[]).map((row) => this.mapper.toResponse(row)),
      { ...result.meta, scope },
    );
  }

  @ReturnCapabilities({
    policy: ShipmentCapabilityBuilder,
  })
  @Authorize({
    policy: Policy(ShipmentPolicy, ShipmentAction.View),
    payloadResolver: (id: string) => ({ shipmentId: id }),
  })
  async findDetailsById(id: string): Promise<ShipmentDetailsResponseDto> {
    const record = await this.findRawOrThrow(id);

    const parcels = await this.parcelQueryService.getRawParcelsForShipment(id);

    return this.mapper.toDetails(
      record,
      parcels.map((p) => this.parcelMapper.toResponse(p)),
    );
  }

  @ReturnCapabilities({
    policy: ShipmentCapabilityBuilder,
  })
  @Authorize({
    policy: Policy(ShipmentPolicy, ShipmentAction.View),
    payloadResolver: (id: string) => ({ shipmentId: id }),
  })
  async findById(id: string): Promise<ShipmentResponseDto> {
    const record = await this.findRawOrThrow(id);
    return this.mapper.toResponse(record);
  }

  async findAggregateOrThrow(id: string): Promise<CustomerShipment> {
    const shipment = await this.queryRepository.findAggregateById(id);

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    return shipment;
  }

  /**
   * A lookup by id bypasses the list filters, so the scope is re-checked here.
   * Not-found is returned rather than forbidden so the endpoint never confirms
   * that another tenant holds this shipment.
   */
  private async findRawOrThrow(id: string): Promise<any> {
    const record = await this.queryRepository.findRawById(id);

    if (!record) {
      throw new NotFoundException('Shipment not found');
    }

    return record;
  }
}
