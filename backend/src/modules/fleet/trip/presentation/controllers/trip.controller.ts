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
import { TripCommandService } from '../../application/services/trip-command.service';
import { TripQueryService } from '../../application/services/trip-query.service';
import { CreateTripDto } from '../../application/dtos/requests/create-trip.dto';
import { UpdateTripDto } from '../../application/dtos/requests/update-trip.dto';
import { TripQueryDto } from '../../application/dtos/requests/trip-query.dto';
import { TripDetailsDto } from '../../application/dtos/responses/trip-details.dto';
import { PaginatedTripListDto } from '../../application/dtos/responses/trip-list.dto';

@ApiTags('Fleet - Trips')
@ApiBearerAuth()
@Controller('trips')
export class TripController {
  constructor(
    private readonly tripCommandService: TripCommandService,
    private readonly tripQueryService: TripQueryService,
    private readonly requestContext: RequestContextService,
  ) {}

  @Post()
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  @ApiOperation({ summary: 'Create a trip between two organization units' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Trip created successfully',
  })
  async createTrip(@Body() dto: CreateTripDto): Promise<{ id: string }> {
    const id = await this.tripCommandService.createTrip(
      this.requestContext.getTenantIdOrThrow(),
      dto,
    );
    return { id };
  }

  @Get()
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE, RoleType.DRIVER)
  @ApiOperation({ summary: 'List trips in the current tenant' })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedTripListDto })
  async findTrips(@Query() query: TripQueryDto): Promise<PaginatedTripListDto> {
    return this.tripQueryService.findTrips(
      this.requestContext.getTenantIdOrThrow(),
      query,
    );
  }

  @Get(':id')
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE, RoleType.DRIVER)
  @ApiOperation({ summary: 'Get trip details' })
  @ApiResponse({ status: HttpStatus.OK, type: TripDetailsDto })
  async getTripDetails(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TripDetailsDto> {
    return this.tripQueryService.getTripDetails(
      this.requestContext.getTenantIdOrThrow(),
      id,
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  @ApiOperation({ summary: 'Update a trip that has not departed yet' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trip updated successfully',
  })
  async updateTrip(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTripDto,
  ): Promise<void> {
    await this.tripCommandService.updateTrip(
      this.requestContext.getTenantIdOrThrow(),
      id,
      dto,
    );
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE, RoleType.DRIVER)
  @ApiOperation({
    summary: 'Start a trip. Requires at least one attached manifest.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Trip started' })
  async startTrip(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.tripCommandService.startTrip(
      this.requestContext.getTenantIdOrThrow(),
      id,
    );
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE, RoleType.DRIVER)
  @ApiOperation({ summary: 'Complete a trip that has departed' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Trip completed' })
  async completeTrip(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.tripCommandService.completeTrip(
      this.requestContext.getTenantIdOrThrow(),
      id,
    );
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  @ApiOperation({ summary: 'Cancel a trip that has not departed yet' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Trip cancelled' })
  async cancelTrip(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.tripCommandService.cancelTrip(
      this.requestContext.getTenantIdOrThrow(),
      id,
    );
  }
}
