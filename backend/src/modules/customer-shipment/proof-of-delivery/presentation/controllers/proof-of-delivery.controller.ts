import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
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
import { ProofOfDeliveryCommandService } from '../../application/services/proof-of-delivery.command.service';
import { ProofOfDeliveryQueryService } from '../../application/services/proof-of-delivery.query.service';
import { RecordDeliveryDto } from '../../application/dtos/requests/record-delivery.dto';
import { ProofOfDeliveryResponseDto } from '../../application/dtos/responses/proof-of-delivery.response.dto';

@ApiTags('Customer Shipments - Proof of Delivery')
@ApiBearerAuth()
@Controller('parcels/:parcelId/proof-of-delivery')
export class ProofOfDeliveryController {
  constructor(
    private readonly commandService: ProofOfDeliveryCommandService,
    private readonly queryService: ProofOfDeliveryQueryService,
    private readonly requestContext: RequestContextService,
  ) {}

  @Post()
  @Roles(RoleType.EMPLOYEE)
  @ApiOperation({
    summary:
      'Record the delivery of a parcel. Allowed once per parcel; also marks it collected.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Proof of delivery recorded',
  })
  async record(
    @Param('parcelId', ParseUUIDPipe) parcelId: string,
    @Body() dto: RecordDeliveryDto,
  ): Promise<{ id: string }> {
    const principal = this.requestContext.getPrincipal();

    return this.commandService.recordDelivery(parcelId, dto, {
      employeeId: principal.profileId ?? principal.subject.id,
      employeeName: principal.subject.id,
    });
  }

  @Get()
  @Roles(
    RoleType.PLATFORM_OWNER,
    RoleType.TENANT_ADMIN,
    RoleType.EMPLOYEE,
    RoleType.CUSTOMER,
  )
  @ApiOperation({ summary: 'Get the proof of delivery recorded for a parcel' })
  @ApiResponse({ status: HttpStatus.OK, type: ProofOfDeliveryResponseDto })
  async findByParcel(
    @Param('parcelId', ParseUUIDPipe) parcelId: string,
  ): Promise<ProofOfDeliveryResponseDto> {
    return this.queryService.findByParcelId(parcelId);
  }
}
