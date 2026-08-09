import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuthorizationFacade,
  Authorize,
} from '../../../../../packages/authorization';
import { Policy } from '../../../../../packages/authorization/policy';
import { ParcelPolicy } from '../../domain/authorization/policies/parcel.policy';
import { ParcelAction } from '../../domain/authorization/actions/parcel.action';
import { CursorPaginatedResponse } from '../../../../../common/pagination/cursor/responses/cursor-paginated-response';
import { ParcelQueryRepository } from '../../infrastructure/repositories/parcel.query.repository';
import { ParcelVisibilityScope } from '../../domain/authorization/scopes/parcel-visibility.scope';
import { ParcelQueryDto } from '../dtos/requests/parcel-query.dto';
import type { ParcelMergedCriteria } from '../dtos/requests/parcel-merged-criteria.interface';
import { ParcelResponseDto } from '../dtos/responses/parcel.response.dto';
import { ParcelMapper } from '../mappers/parcel.mapper';
import { Parcel } from '../../domain/entities/parcel.entity';

@Injectable()
export class ParcelQueryService {
  constructor(
    private readonly queryRepository: ParcelQueryRepository,
    private readonly authorizationFacade: AuthorizationFacade,
    private readonly mapper: ParcelMapper,
  ) {}

  /**
   * Lists the parcels of one shipment.
   *
   * The scope constraints are mandatory: a caller filter may narrow them but a
   * conflicting value is refused outright rather than quietly ignored.
   */
  async findByShipment(
    customerShipmentId: string,
    filter: ParcelQueryDto,
  ): Promise<CursorPaginatedResponse<ParcelResponseDto>> {
    const scope = this.authorizationFacade.buildScope({
      builder: ParcelVisibilityScope,
    });

    const merged: ParcelMergedCriteria = {
      tenantId: scope.parcel?.tenant_id,
      destinationOrgUnitIds: scope.parcel?.destination_org_unit_ids,
      customerShipmentId,
      status: filter.status,
      condition: filter.condition,
      currentOrgUnitId: filter.currentOrgUnitId,
      cursor: filter.cursor,
      limit: filter.limit,
    };

    const result = await this.queryRepository.findMany(merged);

    return new CursorPaginatedResponse(
      (result.data as any[]).map((row) => this.mapper.toResponse(row)),
      result.meta,
    );
  }

  @Authorize({
    policy: Policy(ParcelPolicy, ParcelAction.View),
    payloadResolver: (id: string) => ({ parcelId: id }),
  })
  async findById(id: string): Promise<ParcelResponseDto> {
    const record = await this.findRawOrThrow(id);
    return this.mapper.toResponse(record);
  }

  /**
   * Tracking lookup. Authentication is required by the controller: shipment
   * data belongs to the company and is not public.
   */
  async findByTrackingNumber(
    trackingNumber: string,
  ): Promise<ParcelResponseDto> {
    const record =
      await this.queryRepository.findRawByTrackingNumber(trackingNumber);

    if (!record) {
      throw new NotFoundException('Parcel not found');
    }

    this.assertWithinScope(record);

    return this.mapper.toResponse(record);
  }

  async findAggregateOrThrow(id: string): Promise<Parcel> {
    const parcel = await this.queryRepository.findAggregateById(id);

    if (!parcel) {
      throw new NotFoundException('Parcel not found');
    }

    return parcel;
  }

  async findRawOrThrow(id: string): Promise<any> {
    const record = await this.queryRepository.findRawById(id);

    if (!record) {
      throw new NotFoundException('Parcel not found');
    }

    this.assertWithinScope(record);

    return record;
  }

  /**
   * A row fetched by id bypasses the list filters, so the scope is re-checked
   * here. Not-found is returned rather than forbidden so the endpoint does not
   * confirm that a parcel of another tenant exists.
   */
  private assertWithinScope(record: any): void {
    const scope = this.authorizationFacade.buildScope({
      builder: ParcelVisibilityScope,
    });

    if (
      scope.parcel?.tenant_id &&
      record.tenant_id !== scope.parcel.tenant_id
    ) {
      throw new NotFoundException('Parcel not found');
    }

    if (
      scope.shipment?.sender_customer_profile_id &&
      record.sender_customer_profile_id !==
        scope.shipment.sender_customer_profile_id
    ) {
      throw new NotFoundException('Parcel not found');
    }
  }

  /** Used by the shipment side to derive a shipment status from its parcels. */
  async getStatusesForShipment(customerShipmentId: string) {
    return this.queryRepository.findStatusesByShipmentId(customerShipmentId);
  }

  async getRawParcelsForShipment(customerShipmentId: string): Promise<any[]> {
    return this.queryRepository.findByShipmentId(customerShipmentId);
  }

  /** Guards a filter value that conflicts with a mandatory scope constraint. */
  assertFilterAllowed(
    filterValue: string | undefined,
    scopeValue: string | undefined,
    label: string,
  ): void {
    if (scopeValue && filterValue && filterValue !== scopeValue) {
      throw new ForbiddenException(`You can only filter by your own ${label}.`);
    }
  }
}
