import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../../common/authorization/decorators/roles.decorator';
import { RoleType } from '../../../../../modules/authorization/domain/enums/role.enum';
import { RequestContextService } from '../../../../../packages/context/services/request-context.service';
import { ZonePricingCommandService } from '../../application/services/zone-pricing.command.service';
import { ZonePricingQueryService } from '../../application/services/zone-pricing.query.service';
import { CreateZonePricingDto } from '../../application/dtos/requests/create-zone-pricing.dto';
import { UpdateZonePricingDto } from '../../application/dtos/requests/update-zone-pricing.dto';
import { ZonePricingQueryDto } from '../../application/dtos/requests/zone-pricing-query.dto';
import { ApiCursorPaginationQuery } from '../../../../../common/pagination/cursor/decorators/api-cursor-pagination-query.decorator';

@ApiTags('Zone Pricing')
@ApiBearerAuth()
@Controller('zone-pricing')
export class ZonePricingController {
  constructor(
    private readonly commandService: ZonePricingCommandService,
    private readonly queryService: ZonePricingQueryService,
    private readonly requestContext: RequestContextService,
  ) {}

  @Post()
  @Roles(RoleType.TENANT_ADMIN)
  async createPricing(@Body() dto: CreateZonePricingDto) {
    const tenantId = this.requestContext.getTenantIdOrThrow();
    return this.commandService.createPricing(tenantId, dto);
  }

  @Get()
  @Roles(RoleType.PLATFORM_OWNER, RoleType.TENANT_ADMIN)
  @ApiCursorPaginationQuery()
  async getPricingList(@Query() query: ZonePricingQueryDto) {
    return this.queryService.listPricing(
      query,
      this.requestContext.getTenantId(),
    );
  }

  @Get(':id')
  @Roles(RoleType.PLATFORM_OWNER, RoleType.TENANT_ADMIN)
  async getPricingById(@Param('id') id: string) {
    return this.queryService.getPricingById(
      id,
      this.requestContext.getTenantId(),
    );
  }

  @Patch(':id')
  @Roles(RoleType.TENANT_ADMIN)
  async updatePricing(
    @Param('id') id: string,
    @Body() dto: UpdateZonePricingDto,
  ) {
    const tenantId = this.requestContext.getTenantIdOrThrow();
    return this.commandService.updatePricing(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(RoleType.TENANT_ADMIN)
  async deletePricing(@Param('id') id: string) {
    const tenantId = this.requestContext.getTenantIdOrThrow();
    return this.commandService.deletePricing(tenantId, id);
  }
}
