import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { Roles } from '../../../../common/authorization/decorators/roles.decorator';
import { RoleType } from '../../../authorization/domain/enums/role.enum';
import { createMemoryMulterOptions } from '../../../../packages/storage/src/config/multer.factory';
import type { StorageFile } from '../../../../packages/storage/src';
import { ProfileQueryService } from '../../application/services/profile.query.service';
import { AvatarService } from '../../application/services/avatar.service';
import { MyProfileResponseDto } from '../../application/dtos/responses/my-profile.response.dto';
import { AvatarResponseDto } from '../../application/dtos/responses/avatar.response.dto';
import { PROFILE_AVATAR } from '../../constants/profile.constants';

/** Every login type that has a person behind it. */
const EVERY_SIGNED_IN_TYPE = [
  RoleType.PLATFORM_OWNER,
  RoleType.TENANT_ADMIN,
  RoleType.EMPLOYEE,
  RoleType.DRIVER,
  RoleType.CUSTOMER,
] as const;

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('me')
export class ProfileController {
  constructor(
    private readonly profileQueryService: ProfileQueryService,
    private readonly avatarService: AvatarService,
  ) {}

  /**
   * Deliberately takes no id. The caller can only ever read themselves, which
   * is why a driver may call this while every other employee-read endpoint
   * stays closed to them.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.EMPLOYEE, RoleType.DRIVER)
  @ApiOperation({
    summary:
      'Profile of the signed-in employee or driver, including the vehicle a driver is currently assigned to',
  })
  @ApiResponse({ status: HttpStatus.OK, type: MyProfileResponseDto })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The account has no employee profile attached to it',
  })
  async getMyProfile(): Promise<MyProfileResponseDto> {
    return this.profileQueryService.getMyProfile();
  }

  /**
   * Open to every login type, including a tenant admin, who has no profile
   * table of their own. Like GET /me it takes no id — the avatar is written
   * against whoever is signed in, so nobody can replace someone else's.
   */
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor(
      'file',
      createMemoryMulterOptions({
        maxFileSizeBytes: PROFILE_AVATAR.MAX_SIZE_BYTES,
        maxFiles: 1,
      }),
    ),
  )
  @HttpCode(HttpStatus.OK)
  @Roles(...EVERY_SIGNED_IN_TYPE)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'JPEG, PNG or WebP image, up to 5MB',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Set the avatar of the signed-in user' })
  @ApiResponse({ status: HttpStatus.OK, type: AvatarResponseDto })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Missing file, or a format other than JPEG, PNG or WebP',
  })
  async uploadAvatar(
    @UploadedFile() file: StorageFile,
  ): Promise<AvatarResponseDto> {
    return this.avatarService.upload(file);
  }

  @Delete('avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(...EVERY_SIGNED_IN_TYPE)
  @ApiOperation({ summary: 'Remove the avatar of the signed-in user' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Avatar removed' })
  async removeAvatar(): Promise<void> {
    await this.avatarService.remove();
  }

  /**
   * Readable by any signed-in user: an avatar appears next to a name all over
   * the app — a branch listing its staff, a shipment showing who created it.
   * Writing stays restricted to the owner.
   */
  @Get('avatar/:userId')
  @Roles(...EVERY_SIGNED_IN_TYPE)
  @ApiProduces('image/jpeg', 'image/png', 'image/webp')
  @ApiParam({ name: 'userId', description: 'Login account id' })
  @ApiOperation({ summary: 'Fetch a user avatar as an image' })
  @ApiResponse({ status: HttpStatus.OK, description: 'The image itself' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'That user has no avatar',
  })
  async getAvatar(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Res() response: Response,
  ): Promise<void> {
    const image = await this.avatarService.getStream(userId);

    response.setHeader('Content-Type', image.contentType);
    // Safe to cache hard: the path changes meaning only when the owner
    // replaces the image, and clients re-read the profile to notice.
    response.setHeader('Cache-Control', 'private, max-age=3600');
    image.stream.pipe(response);
  }
}
