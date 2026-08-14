import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../../../common/authorization/decorators/roles.decorator';
import { RoleType } from '../../../../authorization/domain/enums/role.enum';
import { ParcelCommandService } from '../../application/services/parcel.command.service';
import { ParcelQueryService } from '../../application/services/parcel.query.service';
import { ParcelQueryDto } from '../../application/dtos/requests/parcel-query.dto';
import { UpdateParcelStatusDto } from '../../application/dtos/requests/update-parcel-status.dto';
import { ParcelResponseDto } from '../../application/dtos/responses/parcel.response.dto';
import { ParcelTrackingResponseDto } from '../../application/dtos/responses/parcel-tracking.response.dto';

@ApiTags('Customer Shipments - Parcels')
@ApiBearerAuth()
@Controller()
export class ParcelController {
  constructor(
    private readonly commandService: ParcelCommandService,
    private readonly queryService: ParcelQueryService,
  ) {}

  @Get('shipments/:shipmentId/parcels')
  @Roles(
    RoleType.PLATFORM_OWNER,
    RoleType.TENANT_ADMIN,
    RoleType.EMPLOYEE,
    RoleType.CUSTOMER,
  )
  @ApiOperation({ summary: 'List the parcels of one shipment' })
  async findByShipment(
    @Param('shipmentId', ParseUUIDPipe) shipmentId: string,
    @Query() query: ParcelQueryDto,
  ) {
    return this.queryService.findByShipment(shipmentId, query);
  }

  @Get('parcels')
  @Roles(RoleType.PLATFORM_OWNER, RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  @ApiOperation({
    summary: 'List parcels globally (subject to visibility scope)',
  })
  async findAll(@Query() query: ParcelQueryDto) {
    return this.queryService.findAll(query);
  }

  /**
   * Tracking lookup.
   *
   * Authenticated on purpose — shipment data belongs to the company and is not
   * public. Any signed-in role may look up a tracking number, and the
   * visibility scope still limits what they get back.
   */
  @Get('parcels/track/:trackingNumber')
  @Roles(
    RoleType.PLATFORM_OWNER,
    RoleType.TENANT_ADMIN,
    RoleType.EMPLOYEE,
    RoleType.DRIVER,
    RoleType.CUSTOMER,
  )
  @ApiOperation({
    summary: 'Track a parcel by its tracking number. Requires authentication.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: ParcelTrackingResponseDto })
  async track(
    @Param('trackingNumber') trackingNumber: string,
  ): Promise<ParcelTrackingResponseDto> {
    return this.queryService.findByTrackingNumber(trackingNumber);
  }

  @Patch('parcels/:trackingNumber/status')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.EMPLOYEE)
  @ApiOperation({
    summary:
      'Move a parcel to a new status, recording the movement and re-deriving the shipment status',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Parcel status updated' })
  async updateStatus(
    @Param('trackingNumber') trackingNumber: string,
    @Body() dto: UpdateParcelStatusDto,
  ): Promise<void> {
    await this.commandService.updateStatus(trackingNumber, dto);
  }

  @Patch('parcels/:trackingNumber/receive')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.EMPLOYEE)
  @ApiOperation({
    summary:
      'Receive a parcel that has arrived at the branch (transitions to PROCESSING or READY_FOR_COLLECTION)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Parcel received' })
  async receiveParcel(
    @Param('trackingNumber') trackingNumber: string,
  ): Promise<void> {
    await this.commandService.receiveParcel(trackingNumber);
  }

  @Patch('parcels/:trackingNumber/dispatch')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.EMPLOYEE)
  @ApiOperation({
    summary:
      'Mark a parcel as ready for dispatch (transitions from PROCESSING to READY_FOR_DISPATCH)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Parcel ready for dispatch',
  })
  async markReadyForDispatch(
    @Param('trackingNumber') trackingNumber: string,
  ): Promise<void> {
    await this.commandService.markReadyForDispatch(trackingNumber);
  }
}
