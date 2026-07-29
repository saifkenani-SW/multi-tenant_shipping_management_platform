import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
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

import { BaseUuidParamDto } from '../../core/dtos/base-uuid-param.dto';
import { RequireTypes } from '../auth/authorization/decorators/require-types.decorator';
import { UserTypeGuard } from '../auth/authorization/guards/user-type.guard';
import { UserLoginType } from '../auth/types/auth.types';
import { CreateGlobalLocationDto } from './dtos/requests/create-global-location.dto';
import { GlobalLocationQueryDto } from './dtos/requests/global-location-query.dto';
import { UpdateGlobalLocationDto } from './dtos/requests/update-global-location.dto';
import { GlobalLocationDetailsDto } from './dtos/responses/global-location-details.dto';
import { PaginatedGlobalLocationListDto } from './dtos/responses/global-location-list.dto';
import type { IGlobalLocationCommandService } from './interfaces/global-location.command.service.interface';
import type { IGlobalLocationQueryService } from './interfaces/global-location.query.service.interface';

@ApiTags('Global Locations')
@ApiBearerAuth()
@UseGuards(UserTypeGuard)
@Controller('global-locations')
export class GlobalLocationController {
  constructor(
    @Inject('IGlobalLocationCommandService')
    private readonly commandService: IGlobalLocationCommandService,
    @Inject('IGlobalLocationQueryService')
    private readonly queryService: IGlobalLocationQueryService,
  ) {}

  @Post()
  @RequireTypes(UserLoginType.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Create a location (Platform Admin only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Location created successfully',
  })
  async createLocation(
    @Body() dto: CreateGlobalLocationDto,
  ): Promise<{ id: string }> {
    const id = await this.commandService.createLocation(dto);
    return { id };
  }

  @Get()
  @RequireTypes(
    UserLoginType.PLATFORM_ADMIN,
    UserLoginType.EMPLOYEE,
    UserLoginType.CUSTOMER,
  )
  @ApiOperation({
    summary: 'List locations',
    description:
      'Use rootsOnly to list countries, or parentId to walk down the tree.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of locations',
    type: PaginatedGlobalLocationListDto,
  })
  async getLocations(
    @Query() query: GlobalLocationQueryDto,
  ): Promise<PaginatedGlobalLocationListDto> {
    return this.queryService.findLocations(query);
  }

  @Get(':id')
  @RequireTypes(
    UserLoginType.PLATFORM_ADMIN,
    UserLoginType.EMPLOYEE,
    UserLoginType.CUSTOMER,
  )
  @ApiOperation({ summary: 'Get location details with its ancestor chain' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Location details',
    type: GlobalLocationDetailsDto,
  })
  async getLocationDetails(
    @Param() params: BaseUuidParamDto,
  ): Promise<GlobalLocationDetailsDto> {
    return this.queryService.getLocationDetails(params.id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RequireTypes(UserLoginType.PLATFORM_ADMIN)
  @ApiOperation({
    summary: 'Update a location (Platform Admin only)',
    description: 'Type and parent are immutable; they would move a whole tree.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Location updated successfully',
  })
  async updateLocation(
    @Param() params: BaseUuidParamDto,
    @Body() dto: UpdateGlobalLocationDto,
  ): Promise<void> {
    await this.commandService.updateLocation(params.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequireTypes(UserLoginType.PLATFORM_ADMIN)
  @ApiOperation({
    summary: 'Delete a location (Platform Admin only)',
    description: 'Fails while the location has children or is mapped to units.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Location deleted successfully',
  })
  async deleteLocation(@Param() params: BaseUuidParamDto): Promise<void> {
    await this.commandService.deleteLocation(params.id);
  }
}
