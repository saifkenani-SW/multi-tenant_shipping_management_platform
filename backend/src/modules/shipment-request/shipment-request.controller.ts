import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireTypes } from '../auth/authorization/decorators/require-types.decorator';
import { UserTypeGuard } from '../auth/authorization/guards/user-type.guard';
import type { JwtPayload } from '../auth/types/auth.types';
import { UserLoginType } from '../auth/types/auth.types';
import { BaseUuidParamDto } from '../../core/dtos/base-uuid-param.dto';
import { CreateShipmentRequestDto } from './dtos/requests/create-shipment-request.dto';
import { ShipmentRequestQueryDto } from './dtos/requests/shipment-request-query.dto';
import { RejectShipmentRequestDto } from './dtos/requests/reject-shipment-request.dto';
import { CancelShipmentRequestDto } from './dtos/requests/cancel-shipment-request.dto';
import { PaginatedShipmentRequestListDto } from './dtos/responses/shipment-request-list.dto';
import { ShipmentRequestDetailsDto } from './dtos/responses/shipment-request-details.dto';
import { QuotationListItemDto } from './dtos/responses/quotation-list-item.dto';
import type { IShipmentRequestCommandService } from './interfaces/shipment-request.command.service.interface';
import type { IShipmentRequestQueryService } from './interfaces/shipment-request.query.service.interface';

@ApiTags('Shipment Requests')
@ApiBearerAuth()
@UseGuards(UserTypeGuard)
@Controller('shipment-requests')
export class ShipmentRequestController {
  constructor(
    @Inject('IShipmentRequestCommandService')
    private readonly commandService: IShipmentRequestCommandService,
    @Inject('IShipmentRequestQueryService')
    private readonly queryService: IShipmentRequestQueryService,
  ) {}

  @Post()
  @RequireTypes(UserLoginType.CUSTOMER)
  @ApiOperation({ summary: 'Create a new shipment request (Customer only)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Request created' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateShipmentRequestDto,
  ): Promise<{ id: string }> {
    return this.commandService.createRequest(user.sub, dto);
  }

  @Get()
  @RequireTypes(UserLoginType.CUSTOMER, UserLoginType.EMPLOYEE)
  @ApiOperation({ summary: 'List shipment requests relevant to the caller' })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedShipmentRequestListDto })
  async findMany(
    @CurrentUser() user: JwtPayload,
    @Query() query: ShipmentRequestQueryDto,
  ): Promise<PaginatedShipmentRequestListDto> {
    if (user.type === UserLoginType.EMPLOYEE) {
      return this.queryService.findRequestsForEmployee(user.sub, query);
    }
    return this.queryService.findRequestsForCustomer(user.sub, query);
  }

  @Get(':id')
  @RequireTypes(UserLoginType.CUSTOMER, UserLoginType.EMPLOYEE)
  @ApiOperation({ summary: 'Get shipment request details' })
  @ApiResponse({ status: HttpStatus.OK, type: ShipmentRequestDetailsDto })
  async getDetails(
    @CurrentUser() user: JwtPayload,
    @Param() params: BaseUuidParamDto,
  ): Promise<ShipmentRequestDetailsDto> {
    if (user.type === UserLoginType.EMPLOYEE) {
      return this.queryService.getRequestDetailsForEmployee(
        user.sub,
        params.id,
      );
    }
    return this.queryService.getRequestDetailsForCustomer(
      user.sub,
      params.id,
    );
  }

  @Get(':id/quotations')
  @RequireTypes(UserLoginType.CUSTOMER)
  @ApiOperation({ summary: 'List quotations for a shipment request (Customer only)' })
  @ApiResponse({ status: HttpStatus.OK, type: [QuotationListItemDto] })
  async getQuotations(
    @CurrentUser() user: JwtPayload,
    @Param() params: BaseUuidParamDto,
  ): Promise<QuotationListItemDto[]> {
    return this.queryService.getQuotationsForCustomer(user.sub, params.id);
  }

  @Post(':id/quotations/:quotationId/approve')
  @RequireTypes(UserLoginType.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve one quotation (Customer only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Quotation approved' })
  async approveQuotation(
    @CurrentUser() user: JwtPayload,
    @Param() params: BaseUuidParamDto,
    @Param('quotationId') quotationId: string,
  ): Promise<void> {
    await this.commandService.approveQuotation(
      user.sub,
      params.id,
      quotationId,
    );
  }

  @Post(':id/accept')
  @RequireTypes(UserLoginType.EMPLOYEE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a customer-approved request (Employee only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Request converted' })
  async accept(
    @CurrentUser() user: JwtPayload,
    @Param() params: BaseUuidParamDto,
  ): Promise<void> {
    await this.commandService.acceptByEmployee(user.sub, params.id);
  }

  @Post(':id/reject')
  @RequireTypes(UserLoginType.EMPLOYEE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a customer-approved request (Employee only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Request rejected' })
  async reject(
    @CurrentUser() user: JwtPayload,
    @Param() params: BaseUuidParamDto,
    @Body() dto: RejectShipmentRequestDto,
  ): Promise<void> {
    await this.commandService.reject(user.sub, params.id, dto);
  }

  @Post(':id/cancel')
  @RequireTypes(UserLoginType.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a shipment request (Customer only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Request cancelled' })
  async cancel(
    @CurrentUser() user: JwtPayload,
    @Param() params: BaseUuidParamDto,
    @Body() dto: CancelShipmentRequestDto,
  ): Promise<void> {
    await this.commandService.cancel(user.sub, params.id, dto);
  }
}
