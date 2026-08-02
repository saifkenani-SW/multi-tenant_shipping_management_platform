import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { BaseUuidParamDto } from '../../../../core/dtos/base-uuid-param.dto';
import { RequireTypes } from '../../../auth/authorization/decorators/require-types.decorator';
import { UserTypeGuard } from '../../../auth/authorization/guards/user-type.guard';
import { UserLoginType } from '../../../auth/types/auth.types';
import { VehicleCommandService } from '../../application/services/vehicle-command.service';
import { VehicleQueryService } from '../../application/services/vehicle-query.service';
import { CreateVehicleDto } from '../../application/dtos/requests/create-vehicle.dto';
import { UpdateVehicleDto } from '../../application/dtos/requests/update-vehicle.dto';
import { VehicleQueryDto } from '../../application/dtos/requests/vehicle-query.dto';
import { VehicleDetailsDto } from '../../application/dtos/responses/vehicle-details.dto';
import { PaginatedVehicleListDto } from '../../application/dtos/responses/vehicle-list.dto';

@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(UserTypeGuard)
@Controller('vehicles')
export class VehicleController {
  constructor(
    private readonly vehicleCommandService: VehicleCommandService,
    private readonly vehicleQueryService: VehicleQueryService,
  ) {}

  @Post()
  @RequireTypes(UserLoginType.PLATFORM_ADMIN, UserLoginType.EMPLOYEE)
  @ApiOperation({ summary: 'Create a vehicle' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Vehicle created successfully',
  })
  async createVehicle(@Body() dto: CreateVehicleDto): Promise<{ id: string }> {
    const id = await this.vehicleCommandService.createVehicle(dto);
    return { id };
  }

  @Get()
  @RequireTypes(UserLoginType.PLATFORM_ADMIN, UserLoginType.EMPLOYEE)
  @ApiOperation({ summary: 'List vehicles in the current tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PaginatedVehicleListDto,
  })
  async findVehicles(
    @Query() query: VehicleQueryDto,
  ): Promise<PaginatedVehicleListDto> {
    return this.vehicleQueryService.findVehicles(query);
  }

  @Get(':id')
  @RequireTypes(UserLoginType.PLATFORM_ADMIN, UserLoginType.EMPLOYEE)
  @ApiOperation({ summary: 'Get vehicle details' })
  @ApiResponse({ status: HttpStatus.OK, type: VehicleDetailsDto })
  async getVehicleDetails(
    @Param() params: BaseUuidParamDto,
  ): Promise<VehicleDetailsDto> {
    return this.vehicleQueryService.getVehicleDetails(params.id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RequireTypes(UserLoginType.PLATFORM_ADMIN, UserLoginType.EMPLOYEE)
  @ApiOperation({ summary: 'Update a vehicle' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicle updated successfully',
  })
  async updateVehicle(
    @Param() params: BaseUuidParamDto,
    @Body() dto: UpdateVehicleDto,
  ): Promise<void> {
    await this.vehicleCommandService.updateVehicle(params.id, dto);
  }
}
