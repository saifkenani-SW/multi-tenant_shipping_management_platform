import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ShipmentRequestCommandService } from '../../application/services/shipment-request.command.service';
import { CreateShipmentRequestDto } from '../../application/dtos/requests/create-shipment-request.dto';
import { Roles } from '../../../../../common/authorization/decorators/roles.decorator';
import { RoleType } from '../../../../authorization/domain/enums/role.enum';
import { RequestContextService } from '../../../../../packages/context/services/request-context.service';
import { ShipmentRequestQueryService } from '../../application/services/shipment-request.query.service';
import { ShipmentRequestQueryDto } from '../../application/dtos/requests/shipment-request-query.dto';
import { ApiCursorPaginationQuery } from '../../../../../common/pagination/cursor/decorators/api-cursor-pagination-query.decorator';

@ApiTags('Shipment Requests')
@ApiBearerAuth()
@Controller('shipment-requests')
export class ShipmentRequestController {
  constructor(
    private readonly commandService: ShipmentRequestCommandService,
    private readonly queryService: ShipmentRequestQueryService,
    private readonly requestContext: RequestContextService,
  ) {}

  @Post()
  @Roles(RoleType.CUSTOMER)
  async create(@Body() dto: CreateShipmentRequestDto) {
    const principal = this.requestContext.getPrincipal();
    const customerProfileId = principal.profileId;

    if (!customerProfileId) {
      throw new Error(
        'Customer Profile ID is missing from the current request context.',
      );
    }

    return this.commandService.create(customerProfileId, dto);
  }

  @Get()
  @Roles(
    RoleType.CUSTOMER,
    RoleType.PLATFORM_OWNER,
    RoleType.TENANT_ADMIN,
    RoleType.EMPLOYEE,
  )
  @ApiCursorPaginationQuery()
  async findMany(@Query() query: ShipmentRequestQueryDto) {
    return this.queryService.findMany(query);
  }

  @Get(':id')
  @Roles(
    RoleType.CUSTOMER,
    RoleType.PLATFORM_OWNER,
    RoleType.TENANT_ADMIN,
    RoleType.EMPLOYEE,
  )
  async findById(@Param('id') id: string) {
    return this.queryService.findDetailsById(id);
  }

  @Post(':id/company-accept')
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  async companyAccept(@Param('id') id: string) {
    return this.commandService.acceptByCompany(id);
  }

  @Post(':id/company-reject')
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  async companyReject(@Param('id') id: string) {
    return this.commandService.rejectByCompany(id);
  }

  @Post(':id/cancel')
  @Roles(RoleType.CUSTOMER)
  async cancel(@Param('id') id: string) {
    return this.commandService.cancel(id);
  }
}
