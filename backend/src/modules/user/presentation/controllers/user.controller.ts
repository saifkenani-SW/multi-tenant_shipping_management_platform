import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from '../../application/dtos/requests/create-user.dto';
import { UserCommandService } from '../../application/services/user.command.service';
import { Roles } from '../../../../common/authorization';
import { RoleType } from '../../../authorization';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userCommandService: UserCommandService) {}

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
}
