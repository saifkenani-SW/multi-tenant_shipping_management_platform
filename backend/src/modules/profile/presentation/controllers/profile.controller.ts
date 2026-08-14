import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Roles } from '../../../../common/authorization/decorators/roles.decorator';
import { RoleType } from '../../../authorization/domain/enums/role.enum';
import { ProfileQueryService } from '../../application/services/profile.query.service';
import { MyProfileResponseDto } from '../../application/dtos/responses/my-profile.response.dto';

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('me')
export class ProfileController {
  constructor(private readonly profileQueryService: ProfileQueryService) {}

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
}
