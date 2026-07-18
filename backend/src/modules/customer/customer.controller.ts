import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
import type { ICustomerCommandService } from './interfaces/customer.command.service.interface';
import type { ICustomerQueryService } from './interfaces/customer.query.service.interface';

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
  @ApiResponse({ status: 201, description: 'OTP sent to email' })
  @ApiResponse({
    status: 409,
    description: 'Email or phone already registered',
  })
  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.customerCommandService.register(registerDto);
  }

  @ApiOperation({ summary: 'Resend OTP for a pending registration' })
  @ApiResponse({ status: 200, description: 'A new OTP has been sent' })
  @ApiResponse({
    status: 400,
    description:
      'No pending registration, cooldown active, or max requests reached',
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
  @ApiResponse({ status: 200, description: 'Account created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.customerCommandService.verifyOtp(verifyOtpDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the logged-in customer's profile" })
  @ApiResponse({
    status: 200,
    description: 'Customer profile',
    type: CustomerProfileDto,
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
}
