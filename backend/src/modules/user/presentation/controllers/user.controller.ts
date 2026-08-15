import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from '../../application/dtos/requests/create-user.dto';
import { UserQueryDto } from '../../application/dtos/requests/user-query.dto';
import { UserListItemDto } from '../../application/dtos/responses/user-list-item.dto';
import { UserCommandService } from '../../application/services/user.command.service';
import { UserListingQueryService } from '../../application/services/user-listing.query.service';
import { CursorPaginatedResponse } from '../../../../common/pagination/cursor/responses/cursor-paginated-response';
import { RoleType } from '../../../authorization/domain/enums/role.enum';
import { Roles } from '../../../../common/authorization/decorators/roles.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(
    private readonly userCommandService: UserCommandService,
    private readonly userListingQueryService: UserListingQueryService,
  ) {}

  @Post('register')
  @Roles(RoleType.PLATFORM_OWNER, RoleType.TENANT_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user identity' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User identity created successfully',
  })
  async register(@Body() dto: CreateUserDto): Promise<{ id: string }> {
    const id = await this.userCommandService.createUser(dto);
    return { id };
  }

  /**
   * A tenant admin sees only their own workspace. That boundary is applied
   * from the request context, so passing another workspace id is refused
   * rather than ignored — a caller should never be shown a filtered result
   * under the impression it was the one they asked for.
   */
  @Get()
  @Roles(RoleType.PLATFORM_OWNER, RoleType.TENANT_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'List users, searchable by name or email. A platform owner sees everyone; a tenant admin sees only their own workspace.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [UserListItemDto] })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'A tenant admin asked for a workspace other than their own, or has no workspace attached',
  })
  async list(
    @Query() query: UserQueryDto,
  ): Promise<CursorPaginatedResponse<UserListItemDto>> {
    return this.userListingQueryService.list(query);
  }
}
