import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { QuotationQueryService } from '../../application/services/quotation.query.service';
import { QuotationCommandService } from '../../application/services/quotation.command.service';
import { QuotationQueryDto } from '../../application/dtos/requests/quotation-query.dto';
import { SubmitQuotationPriceDto } from '../../application/dtos/requests/submit-quotation-price.dto';
import { Roles } from '../../../../../common/authorization';
import { RoleType } from '../../../../authorization';

@ApiTags('Quotations')
@Controller('quotations')
export class QuotationController {
  constructor(
    private readonly queryService: QuotationQueryService,
    private readonly commandService: QuotationCommandService,
  ) {}

  @Get()
  @Roles(RoleType.PLATFORM_OWNER, RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  async findMany(@Query() query: QuotationQueryDto) {
    return this.queryService.findMany(query);
  }

  @Get(':id')
  @Roles(
    RoleType.PLATFORM_OWNER,
    RoleType.TENANT_ADMIN,
    RoleType.EMPLOYEE,
    RoleType.CUSTOMER,
  )
  async findById(@Param('id') id: string) {
    return this.queryService.findById(id);
  }

  @Post(':id/approve')
  @Roles(RoleType.CUSTOMER)
  async approveQuotation(@Param('id') id: string) {
    return this.commandService.approveQuotation(id);
  }

  @Post(':id/request-price')
  @Roles(RoleType.CUSTOMER)
  async requestManualPricing(@Param('id') id: string) {
    return this.commandService.requestManualPricing(id);
  }

  @Post(':id/submit-price')
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  async submitManualPrice(
    @Param('id') id: string,
    @Body() dto: SubmitQuotationPriceDto,
  ) {
    return this.commandService.submitManualPrice(id, dto);
  }
}
