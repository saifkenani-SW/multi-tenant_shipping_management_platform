import * as fs from 'fs';
import * as path from 'path';

const file = 'src/modules/customer-shipment/parcel/application/services/parcel.query.service.ts';
let content = fs.readFileSync(file, 'utf8');

// Add forwardRef and Inject to imports
content = content.replace(
  "import {",
  "import { forwardRef, Inject, "
);

// Add ShipmentQueryService import
content = content.replace(
  "import { Parcel } from '../../domain/entities/parcel.entity';",
  "import { Parcel } from '../../domain/entities/parcel.entity';\nimport { ShipmentQueryService } from '../../shipment/application/services/shipment.query.service';"
);

// Inject ShipmentQueryService
content = content.replace(
  "constructor(",
  "constructor(\n    @Inject(forwardRef(() => ShipmentQueryService))\n    private readonly shipmentQueryService: ShipmentQueryService,"
);

// Update findByShipment
const oldFindByShipment = `  async findByShipment(
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
  }`;

const newFindByShipment = `  async findByShipment(
    customerShipmentId: string,
    filter: ParcelQueryDto,
  ): Promise<CursorPaginatedResponse<ParcelResponseDto>> {
    // Authorize by fetching the shipment. 
    // ShipmentQueryService.findById evaluates visibility scopes implicitly.
    await this.shipmentQueryService.findById(customerShipmentId);

    // We no longer evaluate ParcelVisibilityScope because the shipment auth suffices.
    const merged: ParcelMergedCriteria = {
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
  }`;

content = content.replace(oldFindByShipment, newFindByShipment);

fs.writeFileSync(file, content);
console.log('Done!');
