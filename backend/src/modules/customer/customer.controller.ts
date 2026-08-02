import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ThrottlerGuard } from '@nestjs/throttler';
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
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireTypes } from '../auth/authorization/decorators/require-types.decorator';
import { UserTypeGuard } from '../auth/authorization/guards/user-type.guard';
import type { JwtPayload } from '../auth/types/auth.types';
import { UserLoginType } from '../auth/types/auth.types';
import { RegisterDto } from './dtos/requests/register.dto';
import { ResendOtpDto } from './dtos/requests/resend-otp.dto';
import { VerifyOtpDto } from './dtos/requests/verify-otp.dto';
import { CustomerProfileDto } from './dtos/responses/customer-profile.dto';
import { UploadProfileImageResponseDto } from './dtos/responses/upload-profile-image.dto';
import type { ICustomerCommandService } from './interfaces/customer.command.service.interface';
import type { ICustomerQueryService } from './interfaces/customer.query.service.interface';
import { createMemoryMulterOptions } from '../../packages/storage/src/config/multer.factory';
import type { StorageFile } from '../../packages/storage/src/contracts/storage-provider.interface';
import { CUSTOMER_PROFILE_IMAGE } from './constants/customer.cache.constants';
import { ForgotPasswordDto } from './dtos/requests/forgot-password.dto';
import { ResetPasswordDto } from './dtos/requests/reset-password.dto';
import { ChangePasswordDto } from './dtos/requests/change-password.dto';
import {
  CustomerApiErrorResponseDto,
  CustomerProfileResponseDto,
  MessageResponseDto,
  UploadProfileImageEnvelopeDto,
} from './dtos/responses/customer-api-response.dto';

@ApiTags('Customer')
@Controller('customer')
export class CustomerController {
  constructor(
    @Inject('ICustomerCommandService')
    private readonly customerCommandService: ICustomerCommandService,
    @Inject('ICustomerQueryService')
    private readonly customerQueryService: ICustomerQueryService,
  ) {}

  @ApiOperation({
    summary: 'Register a new customer account (step 1: request OTP)',
  })
  @ApiResponse({
    status: 201,
    description: 'OTP sent to email',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email or phone already registered',
    type: CustomerApiErrorResponseDto,
  })
  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.customerCommandService.register(registerDto);
  }

  @ApiOperation({
    summary: 'Resend an active registration or password-reset OTP',
  })
  @ApiResponse({
    status: 200,
    description: 'A new OTP has been sent',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'No active OTP request, cooldown active, or max requests reached',
    type: CustomerApiErrorResponseDto,
  })
  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return this.customerCommandService.resendOtp(resendOtpDto);
  }

  @ApiOperation({
    summary:
      'Verify OTP and create the customer account (step 2). Does not log the user in — call /auth/login afterwards.',
  })
  @ApiResponse({
    status: 200,
    description: 'Account created successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired OTP',
    type: CustomerApiErrorResponseDto,
  })
  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.customerCommandService.verifyOtp(verifyOtpDto);
  }

  @ApiOperation({ summary: 'Request an OTP to reset a customer password' })
  @ApiResponse({
    status: 200,
    description:
      'A generic response is returned whether or not the account exists',
    type: MessageResponseDto,
  })
  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.customerCommandService.forgotPassword(dto);
  }

  @ApiOperation({ summary: 'Reset a customer password using an OTP' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired OTP',
    type: CustomerApiErrorResponseDto,
  })
  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.customerCommandService.resetPassword(dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Change the logged-in customer's password" })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Current password is incorrect',
    type: CustomerApiErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token',
    type: CustomerApiErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Authenticated user is not a customer',
    type: CustomerApiErrorResponseDto,
  })
  @UseGuards(UserTypeGuard)
  @RequireTypes(UserLoginType.CUSTOMER)
  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.customerCommandService.changePassword(user.sub, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the logged-in customer's profile" })
  @ApiResponse({
    status: 200,
    description: 'Customer profile',
    type: CustomerProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token',
    type: CustomerApiErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Authenticated user is not a customer',
    type: CustomerApiErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Customer profile not found',
    type: CustomerApiErrorResponseDto,
  })
  @UseGuards(UserTypeGuard)
  @RequireTypes(UserLoginType.CUSTOMER)
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async getProfile(
    @CurrentUser() user: JwtPayload,
  ): Promise<CustomerProfileDto> {
    const profile = await this.customerQueryService.getProfile(user.sub);
    if (!profile) throw new NotFoundException('Customer profile not found');
    return profile;
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: "Upload or replace the logged-in customer's profile image",
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'JPEG, PNG, or WebP image (maximum 5 MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profile image uploaded successfully',
    type: UploadProfileImageEnvelopeDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Missing file or invalid file type',
    type: CustomerApiErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token',
    type: CustomerApiErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Authenticated user is not a customer',
    type: CustomerApiErrorResponseDto,
  })
  @ApiResponse({
    status: 413,
    description: 'Image exceeds the 5 MB limit',
    type: CustomerApiErrorResponseDto,
  })
  @UseGuards(UserTypeGuard)
  @RequireTypes(UserLoginType.CUSTOMER)
  @UseInterceptors(
    FileInterceptor(
      'file',
      createMemoryMulterOptions({
        maxFileSizeBytes: CUSTOMER_PROFILE_IMAGE.MAX_SIZE_BYTES,
        maxFiles: 1,
      }),
    ),
  )
  @Put('profile/image')
  @HttpCode(HttpStatus.OK)
  async uploadProfileImage(
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({
          maxSize: CUSTOMER_PROFILE_IMAGE.MAX_SIZE_BYTES,
        })
        .addFileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ })
        .build({ fileIsRequired: true }),
    )
    file: StorageFile,
  ): Promise<UploadProfileImageResponseDto> {
    return this.customerCommandService.uploadProfileImage(user.sub, file);
  }

  @ApiOperation({ summary: 'Get a customer profile image' })
  @ApiParam({ name: 'id', description: 'Customer profile UUID' })
  @ApiProduces('image/jpeg', 'image/png', 'image/webp')
  @ApiResponse({
    status: 200,
    description: 'Profile image binary',
    content: {
      'image/jpeg': { schema: { type: 'string', format: 'binary' } },
      'image/png': { schema: { type: 'string', format: 'binary' } },
      'image/webp': { schema: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid customer profile UUID',
    type: CustomerApiErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Profile image not found',
    type: CustomerApiErrorResponseDto,
  })
  @Public()
  @Get('profile-image/:id')
  async getProfileImage(
    @Param('id', new ParseUUIDPipe()) profileId: string,
    @Res() response: Response,
  ): Promise<void> {
    const image = await this.customerQueryService.getProfileImage(profileId);

    response.setHeader('Content-Type', image.contentType);
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    image.stream.pipe(response);
  }
}
