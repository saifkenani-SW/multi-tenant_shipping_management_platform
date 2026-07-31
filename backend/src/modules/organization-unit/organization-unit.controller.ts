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
  Put,
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
import { CreateOrganizationUnitDto } from './dtos/requests/create-organization-unit.dto';
import { OrganizationUnitQueryDto } from './dtos/requests/organization-unit-query.dto';
import { SetCoverageDto } from './dtos/requests/set-coverage.dto';
import { UpdateOrganizationUnitDto } from './dtos/requests/update-organization-unit.dto';
import { OrganizationUnitDetailsDto } from './dtos/responses/organization-unit-details.dto';
import { PaginatedOrganizationUnitListDto } from './dtos/responses/organization-unit-list.dto';
import type { IOrganizationUnitCommandService } from './interfaces/organization-unit.command.service.interface';
import type { IOrganizationUnitQueryService } from './interfaces/organization-unit.query.service.interface';

@ApiTags('Organization Units')
@ApiBearerAuth()
@UseGuards(UserTypeGuard)
@Controller('organization-units')
export class OrganizationUnitController {
  constructor(
    @Inject('IOrganizationUnitCommandService')
    private readonly commandService: IOrganizationUnitCommandService,
    @Inject('IOrganizationUnitQueryService')
    private readonly queryService: IOrganizationUnitQueryService,
  ) {}

  @Post()
  @RequireTypes(UserLoginType.PLATFORM_ADMIN, UserLoginType.EMPLOYEE)
  @ApiOperation({ summary: 'Create an organization unit' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Unit created successfully',
  })
  async createUnit(
    @Body() dto: CreateOrganizationUnitDto,
  ): Promise<{ id: string }> {
    const id = await this.commandService.createUnit(dto);
    return { id };
  }

  @Get()
  @RequireTypes(UserLoginType.PLATFORM_ADMIN, UserLoginType.EMPLOYEE)
  @ApiOperation({
    summary: 'List organization units',
    description: 'Use rootsOnly or parentId to walk the tree level by level.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of units',
    type: PaginatedOrganizationUnitListDto,
  })
  async getUnits(
    @Query() query: OrganizationUnitQueryDto,
  ): Promise<PaginatedOrganizationUnitListDto> {
    return this.queryService.findUnits(query);
  }

  @Get(':id')
  @RequireTypes(UserLoginType.PLATFORM_ADMIN, UserLoginType.EMPLOYEE)
  @ApiOperation({
    summary: 'Get unit details with coordinates, coverage and ancestors',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unit details',
    type: OrganizationUnitDetailsDto,
  })
  async getUnitDetails(
    @Param() params: BaseUuidParamDto,
  ): Promise<OrganizationUnitDetailsDto> {
    return this.queryService.getUnitDetails(params.id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RequireTypes(UserLoginType.PLATFORM_ADMIN, UserLoginType.EMPLOYEE)
  @ApiOperation({
    summary: 'Update an organization unit',
    description:
      'Type and parent are immutable; moving a unit needs its own operation.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unit updated successfully',
  })
  async updateUnit(
    @Param() params: BaseUuidParamDto,
    @Body() dto: UpdateOrganizationUnitDto,
  ): Promise<void> {
    await this.commandService.updateUnit(params.id, dto);
  }

  @Put(':id/coverage')
  @HttpCode(HttpStatus.OK)
  @RequireTypes(UserLoginType.PLATFORM_ADMIN, UserLoginType.EMPLOYEE)
  @ApiOperation({
    summary: 'Replace the geographic coverage of a unit',
    description: 'The submitted list becomes the full coverage for the unit.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coverage updated successfully',
  })
  async setCoverage(
    @Param() params: BaseUuidParamDto,
    @Body() dto: SetCoverageDto,
  ): Promise<void> {
    await this.commandService.setCoverage(params.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequireTypes(UserLoginType.PLATFORM_ADMIN, UserLoginType.EMPLOYEE)
  @ApiOperation({
    summary: 'Delete an organization unit',
    description: 'Fails while the unit has children or active assignments.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unit deleted successfully',
  })
  async deleteUnit(@Param() params: BaseUuidParamDto): Promise<void> {
    await this.commandService.deleteUnit(params.id);
  }
}
