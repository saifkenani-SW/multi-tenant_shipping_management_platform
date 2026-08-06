import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiCursorPaginationQuery } from '../../../../common/pagination/cursor/decorators/api-cursor-pagination-query.decorator';

import { Roles } from '../../../../common/authorization/decorators/roles.decorator';
import { RoleType } from '../../../authorization/domain/enums/role.enum';

import { GlobalLocationCommandService } from '../../application/services/global-location.command.service';
import { GlobalLocationQueryService } from '../../application/services/global-location.query.service';
import { CreateGlobalLocationDto } from '../../application/dtos/requests/create-global-location.dto';
import { UpdateGlobalLocationDto } from '../../application/dtos/requests/update-global-location.dto';
import { GlobalLocationQueryDto } from '../../application/dtos/requests/global-location-query.dto';
import { GlobalLocationResponseDto } from '../../application/dtos/responses/global-location.response.dto';
import { CursorPaginatedResponse } from '../../../../common/pagination/cursor/responses/cursor-paginated-response';

@ApiTags('Global Locations')
@Controller('global-locations')
export class GlobalLocationController {
  constructor(
    private readonly commandService: GlobalLocationCommandService,
    private readonly queryService: GlobalLocationQueryService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @Roles(RoleType.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Create a new global location' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The global location has been successfully created.',
    type: String,
  })
  async create(@Body() createDto: CreateGlobalLocationDto): Promise<string> {
    return this.commandService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'List global locations with cursor pagination' })
  @ApiCursorPaginationQuery()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of global locations.',
  })
  async findAll(
    @Query() queryDto: GlobalLocationQueryDto,
  ): Promise<CursorPaginatedResponse<GlobalLocationResponseDto>> {
    return this.queryService.findMany(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a global location by ID' })
  @ApiParam({ name: 'id', description: 'Global Location ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The global location details.',
    type: GlobalLocationResponseDto,
  })
  async findOne(@Param('id') id: string): Promise<GlobalLocationResponseDto> {
    return this.queryService.findById(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(RoleType.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Update a global location' })
  @ApiParam({ name: 'id', description: 'Global Location ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The global location has been successfully updated.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateGlobalLocationDto,
  ): Promise<void> {
    return this.commandService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(RoleType.PLATFORM_OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a global location' })
  @ApiParam({ name: 'id', description: 'Global Location ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The global location has been successfully deleted.',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.commandService.delete(id);
  }
}
