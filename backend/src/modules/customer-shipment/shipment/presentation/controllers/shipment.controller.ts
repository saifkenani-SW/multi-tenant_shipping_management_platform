import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
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
import { ShipmentCommandService } from '../../application/services/shipment.command.service';
import { ShipmentQueryService } from '../../application/services/shipment.query.service';
import { CreateShipmentDto } from '../../application/dtos/requests/create-shipment.dto';
import { ShipmentQueryDto } from '../../application/dtos/requests/shipment-query.dto';
import { ShipmentDetailsResponseDto } from '../../application/dtos/responses/shipment-details.response.dto';
import { RecordShipmentPaymentDto } from '../../application/dtos/requests/record-shipment-payment.dto';
import { InvoiceDetailsResponseDto } from '../../../../billing/invoice/application/dtos/responses/invoice-details.response.dto';

/**
 * Thin by design: role gating happens here, the per-entity policy check lives
 * on the service methods via @Authorize, and every business decision belongs
 * to the domain.
 */
@ApiTags('Customer Shipments')
@ApiBearerAuth()
@Controller('shipments')
export class ShipmentController {
  constructor(
    private readonly commandService: ShipmentCommandService,
    private readonly queryService: ShipmentQueryService,
  ) {}

  @Post()
  @Roles(RoleType.EMPLOYEE)
  @ApiOperation({
    summary: 'Create a shipment together with all of its parcels',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Shipment created successfully',
  })
  async createShipment(
    @Body() dto: CreateShipmentDto,
  ): Promise<{ id: string }> {
    return this.commandService.createShipment(dto);
  }

  @Get()
  @Roles(
    RoleType.PLATFORM_OWNER,
    RoleType.TENANT_ADMIN,
    RoleType.EMPLOYEE,
    RoleType.CUSTOMER,
  )
  @ApiOperation({ summary: 'List shipments visible to the caller' })
  async findMany(@Query() query: ShipmentQueryDto) {
    return this.queryService.findMany(query);
  }

  @Get(':id')
  @Roles(
    RoleType.PLATFORM_OWNER,
    RoleType.TENANT_ADMIN,
    RoleType.EMPLOYEE,
    RoleType.CUSTOMER,
  )
  @ApiOperation({ summary: 'Get a shipment with all of its parcels' })
  @ApiResponse({ status: HttpStatus.OK, type: ShipmentDetailsResponseDto })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ShipmentDetailsResponseDto> {
    return this.queryService.findDetailsById(id);
  }

  @Get(':id/invoice')
  @Roles(
    RoleType.PLATFORM_OWNER,
    RoleType.TENANT_ADMIN,
    RoleType.EMPLOYEE,
    RoleType.CUSTOMER,
  )
  @ApiOperation({
    summary:
      'Get the invoice and full payment history for this shipment, including refunds after a pending cancel',
  })
  @ApiResponse({ status: HttpStatus.OK, type: InvoiceDetailsResponseDto })
  async getInvoice(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InvoiceDetailsResponseDto> {
    return this.queryService.getInvoice(id);
  }

  @Post(':id/payments')
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  @ApiOperation({
    summary:
      'Record a counter payment against the shipment invoice. Handover collection uses proof of delivery instead.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Payment recorded' })
  async recordPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordShipmentPaymentDto,
  ): Promise<{ id: string }> {
    return this.commandService.recordPayment(id, dto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  @ApiOperation({ summary: 'Cancel a shipment that has not been dispatched' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Shipment cancelled' })
  async cancel(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.commandService.cancelShipment(id);
  }
}
