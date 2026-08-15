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
import { Roles } from '../../../../../common/authorization/decorators/roles.decorator';
import { Permissions } from '../../../../../common/authorization/decorators/permissions.decorator';
import { RoleType } from '../../../../authorization/domain/enums/role.enum';
import { PermissionAction, PermissionResource } from '../../../../authorization/domain/enums/permission.enum';
import { RequestContextService } from '../../../../../packages/context/services/request-context.service';
import { ManifestCommandService } from '../../application/services/manifest-command.service';
import { ManifestQueryService } from '../../application/services/manifest-query.service';
import { CreateManifestDto } from '../../application/dtos/requests/create-manifest.dto';
import { ManifestQueryDto } from '../../application/dtos/requests/manifest-query.dto';
import { AddManifestItemDto } from '../../application/dtos/requests/add-manifest-item.dto';
import { UpdateManifestItemStatusDto } from '../../application/dtos/requests/update-manifest-item-status.dto';
import { ManifestDetailsDto } from '../../application/dtos/responses/manifest-details.dto';
import { ManifestItemDto } from '../../application/dtos/responses/manifest-item.dto';
import { PaginatedManifestListDto } from '../../application/dtos/responses/manifest-list.dto';

@ApiTags('Fleet - Transport Manifests')
@ApiBearerAuth()
@Controller('manifests')
export class TransportManifestController {
  constructor(
    private readonly manifestCommandService: ManifestCommandService,
    private readonly manifestQueryService: ManifestQueryService,
    private readonly requestContext: RequestContextService,
  ) {}

  // ──────────────────────────── QUERIES ────────────────────────────────────

  @Get()
  @Roles(
    RoleType.PLATFORM_OWNER,
    RoleType.TENANT_ADMIN,
    RoleType.EMPLOYEE,
    RoleType.DRIVER,
  )
  @Permissions(PermissionAction.READ, PermissionResource.MANIFEST)
  @ApiOperation({ summary: 'List manifests in the current tenant' })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedManifestListDto })
  async findManifests(
    @Query() query: ManifestQueryDto,
  ): Promise<PaginatedManifestListDto> {
    return this.manifestQueryService.findManifests(
      this.requestContext.getTenantId(),
      query,
    );
  }

  @Get('available')
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  @Permissions(PermissionAction.READ, PermissionResource.MANIFEST)
  @ApiOperation({
    summary:
      'List manifests in READY_FOR_DISPATCH status that are not yet assigned to a trip',
  })
  @ApiResponse({ status: HttpStatus.OK })
  async findAvailable() {
    return this.manifestQueryService.findAvailableForBooking(
      this.requestContext.getTenantIdOrThrow(),
    );
  }

  @Get(':id')
  @Roles(
    RoleType.PLATFORM_OWNER,
    RoleType.TENANT_ADMIN,
    RoleType.EMPLOYEE,
    RoleType.DRIVER,
  )
  @Permissions(PermissionAction.READ, PermissionResource.MANIFEST)
  @ApiOperation({ summary: 'Get a manifest with all its parcels' })
  @ApiResponse({ status: HttpStatus.OK, type: ManifestDetailsDto })
  async getManifestDetails(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ManifestDetailsDto> {
    return this.manifestQueryService.getManifestDetails(
      this.requestContext.getTenantId(),
      id,
    );
  }

  @Get(':id/items')
  @Roles(
    RoleType.PLATFORM_OWNER,
    RoleType.TENANT_ADMIN,
    RoleType.EMPLOYEE,
    RoleType.DRIVER,
  )
  @Permissions(PermissionAction.READ, PermissionResource.MANIFEST)
  @ApiOperation({ summary: 'List the parcels on a manifest' })
  @ApiResponse({ status: HttpStatus.OK, type: [ManifestItemDto] })
  async getManifestItems(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ManifestItemDto[]> {
    return this.manifestQueryService.getManifestItems(
      this.requestContext.getTenantId(),
      id,
    );
  }

  // ──────────────────────────── COMMANDS ───────────────────────────────────

  @Post()
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  @Permissions(PermissionAction.CREATE, PermissionResource.MANIFEST)
  @ApiOperation({
    summary: 'Create a standalone OPEN manifest (not yet assigned to a trip)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Manifest created successfully',
  })
  async createManifest(
    @Body() dto: CreateManifestDto,
  ): Promise<{ id: string }> {
    const id = await this.manifestCommandService.createManifest(
      this.requestContext.getTenantIdOrThrow(),
      this.requestContext.getPrincipal()?.profileId,
      dto,
    );
    return { id };
  }

  @Post(':id/finalize')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  @Permissions(PermissionAction.UPDATE, PermissionResource.MANIFEST)
  @ApiOperation({
    summary: 'Finalize a manifest (OPEN → READY_FOR_DISPATCH). Must have ≥1 item.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Manifest finalized' })
  async finalizeManifest(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.manifestCommandService.finalizeManifest(
      this.requestContext.getTenantIdOrThrow(),
      id,
      this.requestContext.getPrincipal()?.profileId,
    );
  }

  @Post(':id/reopen')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  @Permissions(PermissionAction.UPDATE, PermissionResource.MANIFEST)
  @ApiOperation({
    summary:
      'Reopen a manifest (READY_FOR_DISPATCH → OPEN). Only allowed when no trip is linked.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Manifest reopened' })
  async reopenManifest(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.manifestCommandService.reopenManifest(
      this.requestContext.getTenantIdOrThrow(),
      id,
      this.requestContext.getPrincipal()?.profileId,
    );
  }

  @Post(':id/items')
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  @Permissions(PermissionAction.UPDATE, PermissionResource.MANIFEST)
  @ApiOperation({ summary: 'Add a parcel to an OPEN manifest' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Parcel added to the manifest',
  })
  async addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddManifestItemDto,
  ): Promise<{ id: string }> {
    const itemId = await this.manifestCommandService.addItem(
      this.requestContext.getTenantIdOrThrow(),
      id,
      this.requestContext.getPrincipal()?.profileId,
      dto,
    );
    return { id: itemId };
  }

  @Patch(':id/items/:itemId')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE, RoleType.DRIVER)
  @Permissions(PermissionAction.UPDATE, PermissionResource.MANIFEST)
  @ApiOperation({
    summary: 'Mark a parcel on the manifest as loaded, unloaded or missing',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Parcel status updated' })
  async updateItemStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateManifestItemStatusDto,
  ): Promise<void> {
    await this.manifestCommandService.updateItemStatus(
      this.requestContext.getTenantIdOrThrow(),
      id,
      itemId,
      dto,
    );
  }

  @Delete(':id/items/:itemId')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.TENANT_ADMIN, RoleType.EMPLOYEE)
  @Permissions(PermissionAction.UPDATE, PermissionResource.MANIFEST)
  @ApiOperation({
    summary: 'Remove a parcel from an OPEN manifest',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Parcel removed' })
  async removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<void> {
    await this.manifestCommandService.removeItem(
      this.requestContext.getTenantIdOrThrow(),
      id,
      itemId,
      this.requestContext.getPrincipal()?.profileId,
    );
  }
}
