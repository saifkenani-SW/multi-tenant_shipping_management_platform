import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ShipmentRequestQueryRepository } from '../../infrastructure/repositories/shipment-request.query.repository';
import { ShipmentRequestQueryDto } from '../dtos/requests/shipment-request-query.dto';
import { ShipmentRequestMergedCriteria } from '../dtos/requests/shipment-request-merged-criteria.interface';
import { ShipmentRequestResponseDto } from '../dtos/responses/shipment-request.response.dto';
import { ShipmentRequestDetailsResponseDto } from '../dtos/responses/shipment-request-details.response.dto';
import { CursorPaginatedResponse } from '../../../../../common/pagination/cursor/responses/cursor-paginated-response';
import { ShipmentRequestVisibilityScope } from '../../../authorization/scopes/shipment-request-visibility.scope';
import { AuthorizationFacade } from '../../../../../packages/authorization';
import { QuotationQueryService } from '../../../../shipment-request/quotation/application/services/quotation.query.service';
import { GlobalLocationFacade } from '../../../../global-location/facades/global-location.facade';

@Injectable()
export class ShipmentRequestQueryService {
  constructor(
    private readonly queryRepository: ShipmentRequestQueryRepository,
    private readonly authorizationFacade: AuthorizationFacade,
    private readonly quotationQueryService: QuotationQueryService,
    private readonly globalLocationFacade: GlobalLocationFacade,
  ) {}

  private async enrichShipmentRequests(
    rawRequests: any[],
  ): Promise<ShipmentRequestResponseDto[]> {
    if (rawRequests.length === 0) return [];

    const globalLocationIds = [
      ...new Set(
        rawRequests.flatMap((r) => [
          r.origin_global_location_id,
          r.destination_global_location_id,
        ]),
      ),
    ] as string[];

    const globalLocations = await this.globalLocationFacade.getLocationsByIds(
      globalLocationIds,
      false,
    );
    const locationMap = new Map(
      globalLocations.map((loc) => [loc.id, loc.name]),
    );

    return rawRequests.map((record) => ({
      id: record.id,
      customerProfileId: record.customer_profile_id,
      targetTenantId: record.target_tenant_id || undefined,
      originGlobalLocationId: record.origin_global_location_id,
      originGlobalLocationName:
        (locationMap.get(record.origin_global_location_id) as string) ||
        'Unknown Location',
      destinationGlobalLocationId: record.destination_global_location_id,
      destinationGlobalLocationName:
        (locationMap.get(record.destination_global_location_id) as string) ||
        'Unknown Location',
      senderName: record.sender_name,
      senderPhone: record.sender_phone,
      receiverName: record.receiver_name,
      receiverPhone: record.receiver_phone,
      expectedPiecesCount: record.expected_pieces_count,
      expectedTotalWeightKg: Number(record.expected_total_weight_kg),
      status: record.status as string,
      approvedQuotationId: record.approved_quotation_id || undefined,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));
  }

  async findMany(
    filter: ShipmentRequestQueryDto,
  ): Promise<CursorPaginatedResponse<ShipmentRequestResponseDto>> {
    const scope = this.authorizationFacade.buildScope({
      builder: ShipmentRequestVisibilityScope,
    });

    // --- Validate filter against mandatory scope constraints ---
    if (scope.request?.customer_profile_id && filter.customerProfileId) {
      if (filter.customerProfileId !== scope.request.customer_profile_id) {
        throw new ForbiddenException(
          'You can only filter by your own customer profile.',
        );
      }
    }

    if (scope.request?.target_tenant_id && filter.targetTenantId) {
      if (filter.targetTenantId !== scope.request.target_tenant_id) {
        throw new ForbiddenException('You can only filter by your own tenant.');
      }
    }

    // --- Merge scope + filter into one unified criteria ---
    const mergedCriteria: ShipmentRequestMergedCriteria = {
      customerProfileId:
        scope.request?.customer_profile_id ?? filter.customerProfileId,
      targetTenantId: scope.request?.target_tenant_id ?? filter.targetTenantId,
      originGlobalLocationId: filter.originGlobalLocationId,
      destinationGlobalLocationId: filter.destinationGlobalLocationId,
      senderPhone: filter.senderPhone,
      receiverPhone: filter.receiverPhone,
      status: filter.status,
      cursor: filter.cursor,
      limit: filter.limit,
    };

    const result = await this.queryRepository.findMany(mergedCriteria);
    const enriched = await this.enrichShipmentRequests(result.data as any[]);

    return new CursorPaginatedResponse(enriched, result.meta);
  }

  async findDetailsById(
    id: string,
  ): Promise<ShipmentRequestDetailsResponseDto> {
    const rawRequest = await this.findById(id);

    const scope = this.authorizationFacade.buildScope({
      builder: ShipmentRequestVisibilityScope,
    });

    const [enrichedRequest] = await this.enrichShipmentRequests([rawRequest]);
    const quotations = await this.quotationQueryService.findByShipmentRequestId(
      id,
      scope,
    );

    return {
      ...enrichedRequest,
      quotations,
    };
  }

  async findById(id: string): Promise<any> {
    const rawRequest = await this.queryRepository.findById(id);

    if (!rawRequest) {
      throw new NotFoundException(
        'Shipment request not found or you do not have permission to view it.',
      );
    }

    const scope = this.authorizationFacade.buildScope({
      builder: ShipmentRequestVisibilityScope,
    });

    if (scope.request?.customer_profile_id) {
      if (rawRequest.customerProfileId !== scope.request.customer_profile_id) {
        throw new NotFoundException(
          'Shipment request not found or you do not have permission to view it.',
        );
      }
    }

    if (scope.request?.target_tenant_id) {
      if (
        rawRequest.targetTenantId !== scope.request.target_tenant_id &&
        rawRequest.targetTenantId !== undefined
      ) {
        throw new NotFoundException(
          'Shipment request not found or you do not have permission to view it.',
        );
      }
    }

    return rawRequest;
  }
}
