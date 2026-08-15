import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../../../common/authorization/decorators/roles.decorator';
import { RoleType } from '../../../../authorization/domain/enums/role.enum';
import { ParcelCommandService } from '../../application/services/parcel.command.service';
import { ParcelQueryService } from '../../application/services/parcel.query.service';
import { ParcelQueryDto } from '../../application/dtos/requests/parcel-query.dto';
import { UpdateParcelStatusDto } from '../../application/dtos/requests/update-parcel-status.dto';
import { ParcelTrackingResponseDto } from '../../application/dtos/responses/parcel-tracking.response.dto';
import { RecordDeliveryDto } from '../../../proof-of-delivery/application/dtos/requests/record-delivery.dto';
import { ProofOfDeliveryResponseDto } from '../../../proof-of-delivery/application/dtos/responses/proof-of-delivery.response.dto';
import { GetParcelStatisticsResponseDto } from '../../application/dtos/responses/parcel-statistics.response.dto';

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

  @Get('parcels/statistics')
  @Roles(
    RoleType.PLATFORM_OWNER,
    RoleType.TENANT_ADMIN,
    RoleType.EMPLOYEE,
    RoleType.CUSTOMER,
  )
  @ApiOperation({
    summary:
      'Get aggregated statistics of all parcels within the visibility scope. No filters required.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: GetParcelStatisticsResponseDto })
  async getStatistics(): Promise<GetParcelStatisticsResponseDto> {
    return this.queryService.getStatistics();
  }

  @Get('parcels')
  @Roles(
    RoleType.PLATFORM_OWNER,
    RoleType.TENANT_ADMIN,
    RoleType.EMPLOYEE,
    RoleType.CUSTOMER,
  )
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

  @Post('parcels/:trackingNumber/proof-of-delivery')
  @Roles(RoleType.EMPLOYEE)
  @ApiOperation({
    summary:
      'Record the delivery of a parcel. Allowed once per parcel; also marks it collected.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Proof of delivery recorded',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'signature', maxCount: 1 },
        { name: 'idPhoto', maxCount: 1 },
        { name: 'parcelPhoto', maxCount: 1 },
        { name: 'additionalPhoto', maxCount: 3 },
      ],
      { limits: { fileSize: 10 * 1024 * 1024 } }, // 10 MB limit
    ),
  )
  async record(
    @Param('trackingNumber') trackingNumber: string,
    @Body() dto: RecordDeliveryDto,
    @UploadedFiles()
    files: {
      signature?: any[];
      idPhoto?: any[];
      parcelPhoto?: any[];
      additionalPhoto?: any[];
    },
  ): Promise<{ id: string }> {
    return this.commandService.recordDelivery(trackingNumber, dto, files);
  }

  @Get('parcels/:trackingNumber/proof-of-delivery')
  @Roles(
    RoleType.PLATFORM_OWNER,
    RoleType.TENANT_ADMIN,
    RoleType.EMPLOYEE,
    RoleType.CUSTOMER,
  )
  @ApiOperation({ summary: 'Get the proof of delivery recorded for a parcel' })
  @ApiResponse({ status: HttpStatus.OK, type: ProofOfDeliveryResponseDto })
  async findByParcel(
    @Param('trackingNumber') trackingNumber: string,
  ): Promise<ProofOfDeliveryResponseDto> {
    return this.queryService.getProofOfDelivery(trackingNumber);
  }

  @Get('parcels/:trackingNumber/proof-of-delivery/photos/:photoType')
  @Roles(
    RoleType.PLATFORM_OWNER,
    RoleType.TENANT_ADMIN,
    RoleType.EMPLOYEE,
    RoleType.CUSTOMER,
  )
  @ApiOperation({
    summary: 'Stream a specific photo from the proof of delivery',
  })
  @ApiParam({
    name: 'photoType',
    enum: ['signature', 'idPhoto', 'parcelPhoto', 'additionalPhoto'],
  })
  @ApiQuery({
    name: 'index',
    required: false,
    type: Number,
    description: 'Index of the photo if it is an array (e.g. additionalPhoto)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'The photo file stream' })
  async getPhoto(
    @Param('trackingNumber') trackingNumber: string,
    @Param('photoType')
    photoType: 'signature' | 'idPhoto' | 'parcelPhoto' | 'additionalPhoto',
    @Res() res: Response,
    @Query('index') index?: string,
  ): Promise<void> {
    const { stream, mimeType } = await this.queryService.getPhotoStream(
      trackingNumber,
      photoType,
      index ? parseInt(index, 10) : 0,
    );
    res.setHeader('Content-Type', mimeType);
    stream.pipe(res);
  }
}
