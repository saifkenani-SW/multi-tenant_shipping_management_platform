import { Body, Controller, Delete, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationService } from '../application/notification.service';
import { RegisterDeviceTokenDto } from '../application/dtos/register-device-token.dto';
import { RequestContextService } from '../../../packages/context/services/request-context.service';
import { Roles } from '../../../common/authorization/decorators/roles.decorator';
import { RoleType } from '../../authorization/domain/enums/role.enum';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly requestContext: RequestContextService,
  ) {}

  @Post('tokens')
  @Roles(
    RoleType.CUSTOMER,
    RoleType.EMPLOYEE,
    RoleType.TENANT_ADMIN,
    RoleType.PLATFORM_OWNER,
  )
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'تسجيل FCM token للجهاز الحالي' })
  async registerToken(@Body() dto: RegisterDeviceTokenDto): Promise<void> {
    const userId = this.requestContext.getPrincipal().subject.id;
    await this.notificationService.registerToken(userId, dto.fcmToken, dto.platform);
  }

  @Delete('tokens')
  @Roles(
    RoleType.CUSTOMER,
    RoleType.EMPLOYEE,
    RoleType.TENANT_ADMIN,
    RoleType.PLATFORM_OWNER,
  )
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'حذف FCM token عند تسجيل الخروج' })
  async removeToken(@Body() dto: RegisterDeviceTokenDto): Promise<void> {
    const userId = this.requestContext.getPrincipal().subject.id;
    await this.notificationService.removeToken(userId, dto.fcmToken);
  }
}
