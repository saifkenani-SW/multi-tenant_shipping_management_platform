import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../../common/authorization/decorators/roles.decorator';
import { RoleType } from '../../../../authorization/domain/enums/role.enum';
import { InvoiceQueryService } from '../../application/services/invoice.query.service';
import { InvoiceQueryDto } from '../../application/dtos/requests/invoice-query.dto';

/**
 * Searching across invoices. A single shipment's invoice and its payments
 * are reached through GET /shipments/:id/invoice, which uses shipment auth.
 */
@ApiTags('Billing - Invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly queryService: InvoiceQueryService) {}

  @Get()
  @Roles(RoleType.PLATFORM_OWNER, RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  @ApiOperation({
    summary:
      'Search invoices by status, customer, branch or date. Staff see their own branches. Payment history for one shipment is GET /shipments/:id/invoice.',
  })
  async findMany(@Query() query: InvoiceQueryDto) {
    return this.queryService.findMany(query);
  }
}
