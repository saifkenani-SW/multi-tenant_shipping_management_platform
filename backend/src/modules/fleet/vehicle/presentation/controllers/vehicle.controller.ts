import {
  Body,
  Controller,
  Delete,
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
import { VehicleNotFoundException } from '../../domain/exceptions/vehicle-not-found.exception';
import { Roles } from '../../../../../common/authorization/decorators/roles.decorator';
import { RoleType } from '../../../../authorization/domain/enums/role.enum';
import { RequestContextService } from '../../../../../packages/context/services/request-context.service';
import { VehicleCommandService } from '../../application/services/vehicle-command.service';
import { VehicleQueryService } from '../../application/services/vehicle-query.service';
import { CreateVehicleDto } from '../../application/dtos/requests/create-vehicle.dto';
import { UpdateVehicleDto } from '../../application/dtos/requests/update-vehicle.dto';
import { VehicleQueryDto } from '../../application/dtos/requests/vehicle-query.dto';
import { AssignDriverDto } from '../../application/dtos/requests/assign-driver.dto';
import { VehicleDetailsDto } from '../../application/dtos/responses/vehicle-details.dto';
import { PaginatedVehicleListDto } from '../../application/dtos/responses/vehicle-list.dto';
import { VehicleAssignmentDto } from '../../application/dtos/responses/vehicle-assignment.dto';

@ApiTags('Fleet - Vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehicleController {
  constructor(
    private readonly vehicleCommandService: VehicleCommandService,
    private readonly vehicleQueryService: VehicleQueryService,
    private readonly requestContext: RequestContextService,
  ) {}

  @Post()
  @Roles(RoleType.TENANT_ADMIN)
  @ApiOperation({ summary: 'Create a vehicle' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Vehicle created successfully',
  })
  async createVehicle(@Body() dto: CreateVehicleDto): Promise<{ id: string }> {
    console.log('PRINCEPAL_ =', this.requestContext.getPrincipal());
    const id = await this.vehicleCommandService.createVehicle(
      this.requestContext.getTenantIdOrThrow(),
      dto,
    );
    return { id };
  }

  @Get()
  @Roles(RoleType.PLATFORM_OWNER, RoleType.TENANT_ADMIN)
  @ApiOperation({ summary: 'List vehicles in the current tenant' })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedVehicleListDto })
  async findVehicles(
    @Query() query: VehicleQueryDto,
  ): Promise<PaginatedVehicleListDto> {
    return this.vehicleQueryService.findVehicles(
      this.requestContext.getTenantId(),
      query,
    );
  }

  @Get('my')
  @Roles(RoleType.DRIVER)
  @ApiOperation({ summary: 'Get the vehicle assigned to the current driver' })
  @ApiResponse({ status: HttpStatus.OK, type: VehicleDetailsDto })
  async findMyVehicle(): Promise<VehicleDetailsDto> {
    const tenantId = this.requestContext.getTenantIdOrThrow();
    const employeeId = this.requestContext.getPrincipal().profileId;
    if (!employeeId) {
      throw new VehicleNotFoundException();
    }

    const vehicleId =
      await this.vehicleQueryService.getActiveVehicleIdForDriver(
        tenantId,
        employeeId,
      );

    if (!vehicleId) {
      throw new VehicleNotFoundException();
    }

    return this.vehicleQueryService.getVehicleDetails(tenantId, vehicleId);
  }

  @Get(':id')
  @Roles(RoleType.PLATFORM_OWNER, RoleType.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get vehicle details' })
  @ApiResponse({ status: HttpStatus.OK, type: VehicleDetailsDto })
  async getVehicleDetails(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<VehicleDetailsDto> {
    return this.vehicleQueryService.getVehicleDetails(
      this.requestContext.getTenantId(),
      id,
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update a vehicle' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicle updated successfully',
  })
  async updateVehicle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ): Promise<void> {
    await this.vehicleCommandService.updateVehicle(
      this.requestContext.getTenantIdOrThrow(),
      id,
      dto,
    );
  }

  @Post(':id/assignments')
  @Roles(RoleType.TENANT_ADMIN)
  @ApiOperation({ summary: 'Assign a driver to a vehicle' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Driver assigned successfully',
  })
  async assignDriver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignDriverDto,
  ): Promise<{ id: string }> {
    const assignmentId = await this.vehicleCommandService.assignDriver(
      this.requestContext.getTenantIdOrThrow(),
      id,
      dto,
    );
    return { id: assignmentId };
  }

  @Get(':id/assignments')
  @Roles(RoleType.PLATFORM_OWNER, RoleType.TENANT_ADMIN)
  @ApiOperation({ summary: 'List driver assignments of a vehicle' })
  @ApiResponse({ status: HttpStatus.OK, type: [VehicleAssignmentDto] })
  async getVehicleAssignments(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<VehicleAssignmentDto[]> {
    return this.vehicleQueryService.getVehicleAssignments(
      this.requestContext.getTenantId(),
      id,
    );
  }

  @Delete(':id/assignments/:assignmentId')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.TENANT_ADMIN)
  @ApiOperation({ summary: 'Release an active driver assignment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assignment released successfully',
  })
  async releaseAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
  ): Promise<void> {
    await this.vehicleCommandService.releaseAssignment(
      this.requestContext.getTenantIdOrThrow(),
      id,
      assignmentId,
    );
  }
}
