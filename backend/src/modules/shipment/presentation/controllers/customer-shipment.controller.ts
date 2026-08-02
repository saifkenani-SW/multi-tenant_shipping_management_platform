import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CustomerShipmentCommandService } from '../../application/services/customer-shipment.command.service';
import { CustomerShipmentQueryService } from '../../application/services/customer-shipment.query.service';
import { CreateCustomerShipmentDto } from '../../application/dtos/requests/create-customer-shipment.dto';
import { UpdateCustomerShipmentDto } from '../../application/dtos/requests/update-customer-shipment.dto';
import { CustomerShipmentQueryDto } from '../../application/dtos/requests/customer-shipment-query.dto';
import { CustomerShipmentListDto } from '../../application/dtos/responses/customer-shipment-list.dto';
import { CustomerShipmentDetailsDto } from '../../application/dtos/responses/customer-shipment-details.dto';
import { BaseUuidParamDto } from '../../../../core/dtos/base-uuid-param.dto';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../../auth/types/auth.types';

@ApiTags('Customer Shipments')
@ApiBearerAuth()
@Controller('shipments/customer')
export class CustomerShipmentController {
  constructor(
    private readonly commandService: CustomerShipmentCommandService,
    private readonly queryService: CustomerShipmentQueryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer shipment' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Shipment created successfully',
    type: String,
  })
  async createShipment(
    @Body() dto: CreateCustomerShipmentDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ id: string }> {
    const tenantId = user.tenantId as string; // Assume user is scoped to a tenant
    const id = await this.commandService.createShipment(tenantId, dto);
    return { id };
  }

  @Get()
  @ApiOperation({ summary: 'List customer shipments' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of shipments',
    type: CustomerShipmentListDto,
  })
  async getShipments(
    @Query() query: CustomerShipmentQueryDto,
  ): Promise<CustomerShipmentListDto> {
    return this.queryService.findShipments(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer shipment details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shipment details',
    type: CustomerShipmentDetailsDto,
  })
  async getShipmentDetails(
    @Param() params: BaseUuidParamDto,
  ): Promise<CustomerShipmentDetailsDto> {
    return this.queryService.getShipmentDetails(params.id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update customer shipment details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shipment updated successfully',
  })
  async updateShipment(
    @Param() params: BaseUuidParamDto,
    @Body() dto: UpdateCustomerShipmentDto,
  ): Promise<void> {
    await this.commandService.updateShipment(params.id, dto);
  }
}
