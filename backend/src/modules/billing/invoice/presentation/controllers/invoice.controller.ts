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
import { RequestContextService } from '../../../../../packages/context/services/request-context.service';
import { InvoiceQueryService } from '../../application/services/invoice.query.service';
import { InvoiceCommandService } from '../../application/services/invoice.command.service';
import { InvoiceQueryDto } from '../../application/dtos/requests/invoice-query.dto';
import { SettleInvoiceDto } from '../../application/dtos/requests/settle-invoice.dto';
import { InvoiceDetailsResponseDto } from '../../application/dtos/responses/invoice-details.response.dto';

/**
 * Searching and reporting across invoices.
 *
 * A single invoice belonging to a shipment is reached through the shipment
 * controller instead, because it has no meaning apart from that shipment and
 * whoever may see the shipment may see its invoice. This controller exists for
 * the case that has no shipment to start from: looking across many invoices at
 * once.
 */
@ApiTags('Billing - Invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoiceController {
  constructor(
    private readonly queryService: InvoiceQueryService,
    private readonly commandService: InvoiceCommandService,
    private readonly requestContext: RequestContextService,
  ) {}

  @Get()
  @Roles(RoleType.PLATFORM_OWNER, RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  @ApiOperation({
    summary:
      'Search invoices by status, customer, branch or date. Staff see their own branches.',
  })
  async findMany(@Query() query: InvoiceQueryDto) {
    return this.queryService.findMany(query);
  }

  @Get(':id')
  @Roles(RoleType.PLATFORM_OWNER, RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  @ApiOperation({ summary: 'Get one invoice with its payment history' })
  @ApiResponse({ status: HttpStatus.OK, type: InvoiceDetailsResponseDto })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InvoiceDetailsResponseDto> {
    return this.queryService.findDetailsById(id);
  }

  @Post(':id/payments')
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  @ApiOperation({
    summary:
      'Record a payment against an invoice and re-derive its status from what has been collected',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment recorded',
  })
  async settle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SettleInvoiceDto,
  ): Promise<{ id: string }> {
    // Reuses the read path so a caller cannot pay an invoice they may not see.
    await this.queryService.findById(id);

    const principal = this.requestContext.getPrincipal();

    return this.commandService.recordPayment({
      invoiceId: id,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      collectedByEmployeeId: principal.profileId ?? null,
      organizationUnitId: dto.organizationUnitId ?? null,
      transactionReference: dto.transactionReference ?? null,
    });
  }
}
