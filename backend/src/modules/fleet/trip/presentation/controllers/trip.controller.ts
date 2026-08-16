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
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../../../common/authorization/decorators/roles.decorator';
import { Permissions } from '../../../../../common/authorization/decorators/permissions.decorator';
import { RoleType } from '../../../../authorization/domain/enums/role.enum';
import {
  PermissionAction,
  PermissionResource,
} from '../../../../authorization/domain/enums/permission.enum';
import { RequestContextService } from '../../../../../packages/context/services/request-context.service';
import { TripCommandService } from '../../application/services/trip-command.service';
import { TripQueryService } from '../../application/services/trip-query.service';
import { CreateTripDto } from '../../application/dtos/requests/create-trip.dto';
import { UpdateTripDto } from '../../application/dtos/requests/update-trip.dto';
import { TripQueryDto } from '../../application/dtos/requests/trip-query.dto';
import { TripDetailsDto } from '../../application/dtos/responses/trip-details.dto';
import { PaginatedTripListDto } from '../../application/dtos/responses/trip-list.dto';
import { AssignManifestsDto } from '../../application/dtos/requests/assign-manifests.dto';

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
  @Permissions(PermissionAction.CREATE, PermissionResource.TRIP)
  @ApiOperation({ summary: 'Create a trip between two organization units' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Trip created successfully',
  })
  async createTrip(@Body() dto: CreateTripDto): Promise<{ id: string }> {
    const id = await this.tripCommandService.createTrip(
      this.requestContext.getTenantIdOrThrow(),
      this.requestContext.getPrincipal()?.profileId,
      dto,
    );
    return { id };
  }

  @Get('my/active')
  @Roles(RoleType.DRIVER)
  @ApiOperation({
    summary: 'Get the active trip assigned to the current driver',
  })
  @ApiResponse({ status: HttpStatus.OK, type: TripDetailsDto })
  async findMyActiveTrip(): Promise<TripDetailsDto> {
    const tenantId = this.requestContext.getTenantIdOrThrow();
    const driverId = this.requestContext.getPrincipal()!.profileId!;
    const trip = await this.tripQueryService.findMyActiveTrip(
      tenantId,
      driverId,
    );
    if (!trip) {
      throw new NotFoundException('No active trip found');
    }
    return trip;
  }

  @Get()
  @Roles(
    RoleType.PLATFORM_OWNER,
    RoleType.TENANT_ADMIN,
    RoleType.EMPLOYEE,
    RoleType.DRIVER,
  )
  @Permissions(PermissionAction.READ, PermissionResource.TRIP)
  @ApiOperation({ summary: 'List trips in the current tenant' })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedTripListDto })
  async findTrips(@Query() query: TripQueryDto): Promise<PaginatedTripListDto> {
    return this.tripQueryService.findTrips(
      this.requestContext.getTenantId(),
      query,
    );
  }

  @Get(':id')
  @Roles(
    RoleType.PLATFORM_OWNER,
    RoleType.TENANT_ADMIN,
    RoleType.EMPLOYEE,
    RoleType.DRIVER,
  )
  @Permissions(PermissionAction.READ, PermissionResource.TRIP)
  @ApiOperation({ summary: 'Get trip details' })
  @ApiResponse({ status: HttpStatus.OK, type: TripDetailsDto })
  async getTripDetails(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TripDetailsDto> {
    return this.tripQueryService.getTripDetails(
      this.requestContext.getTenantId(),
      id,
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  @Permissions(PermissionAction.UPDATE, PermissionResource.TRIP)
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

  @Patch(':id/manifests')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  @Permissions(PermissionAction.UPDATE, PermissionResource.TRIP)
  @ApiOperation({
    summary:
      'Assign READY_FOR_DISPATCH manifests to an existing scheduled trip',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Manifests assigned' })
  async assignManifests(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignManifestsDto,
  ): Promise<void> {
    await this.tripCommandService.assignManifestsToTrip(
      this.requestContext.getTenantIdOrThrow(),
      id,
      dto.manifestIds,
    );
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  @Permissions(PermissionAction.UPDATE, PermissionResource.TRIP)
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

  @Post('my/active/start')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.DRIVER)
  @ApiOperation({
    summary: 'Start the active trip for the current driver.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Trip started' })
  async startMyTrip(): Promise<void> {
    const tenantId = this.requestContext.getTenantIdOrThrow();
    const driverId = this.requestContext.getPrincipal()!.profileId!;
    const trip = await this.tripQueryService.findMyActiveTrip(
      tenantId,
      driverId,
    );
    if (!trip) {
      throw new NotFoundException('No active trip found to start');
    }
    await this.tripCommandService.startTrip(tenantId, trip.id);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  @Permissions(PermissionAction.UPDATE, PermissionResource.TRIP)
  @ApiOperation({ summary: 'Complete a trip that has departed' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Trip completed' })
  async completeTrip(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.tripCommandService.completeTrip(
      this.requestContext.getTenantIdOrThrow(),
      id,
    );
  }

  @Post('my/active/complete')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.DRIVER)
  @ApiOperation({ summary: 'Complete the active trip for the current driver' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Trip completed' })
  async completeMyTrip(): Promise<void> {
    const tenantId = this.requestContext.getTenantIdOrThrow();
    const driverId = this.requestContext.getPrincipal()!.profileId!;
    const trip = await this.tripQueryService.findMyActiveTrip(
      tenantId,
      driverId,
    );
    if (!trip) {
      throw new NotFoundException('No active trip found to complete');
    }
    await this.tripCommandService.completeTrip(tenantId, trip.id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  @Permissions(PermissionAction.UPDATE, PermissionResource.TRIP)
  @ApiOperation({ summary: 'Cancel a trip that has not departed yet' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Trip cancelled' })
  async cancelTrip(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.tripCommandService.cancelTrip(
      this.requestContext.getTenantIdOrThrow(),
      id,
    );
  }
}
