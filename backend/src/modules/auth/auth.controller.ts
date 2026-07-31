import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { Public } from './decorators/public.decorator';
import { GetClientType } from './decorators/client-type.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './types/auth.types';
import { ClientType } from './types/auth.types';
import type { CookieOptions, Request, Response } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Successful login' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiHeader({
    name: 'client-type',
    required: false,
    enum: ClientType,
    description:
      'يحدد طريقة استلام التوكن: WEB (عبر الـ Cookies) أو MOBILE (عبر الـ JSON Body)',
  })
  async login(
    @Body() loginDto: LoginDto,
    @GetClientType() clientType: ClientType,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    if (clientType === ClientType.WEB) {
      this.setCookies(res, result.accessToken, result.refreshToken);
      return { message: 'Logged in successfully', user: result.user };
    }

    return result;
  }

  @ApiOperation({ summary: 'Refresh access tokens' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh tokens' })
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiHeader({
    name: 'client-type',
    required: false,
    enum: ClientType,
  })
  async refresh(
    @Body() body: RefreshTokenDto,
    @GetClientType() clientType: ClientType,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    let token = body.refreshToken;
    if (
      clientType === ClientType.WEB &&
      req.cookies &&
      req.cookies['refresh_token']
    ) {
      token = req.cookies['refresh_token'];
    }

    if (!token) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: 'Refresh tokens missing' });
    }

    const result = await this.authService.refreshToken({ refreshToken: token });

    if (clientType === ClientType.WEB) {
      this.setCookies(res, result.accessToken, result.refreshToken);
      return { message: 'Token refreshed successfully' };
    }

    return result;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: JwtPayload,
    @GetClientType() clientType: ClientType,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.sessionId);

    if (clientType === ClientType.WEB) {
      const commonOptions: CookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      };

      res.clearCookie('access_token', { ...commonOptions, path: '/' });
      res.clearCookie('refresh_token', {
        ...commonOptions,
        path: '/auth/refresh',
      });
    }

    return { message: 'Logged out successfully' };
  }

  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    // ثابتة دائمًا: secure + sameSite=none، ضرورية لأن الفرونت (localhost)
    // والباك (saifkenani.me عبر HTTPS) على origins مختلفة
    const baseCookieOptions: CookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    };
    res.cookie('access_token', accessToken, {
      ...baseCookieOptions,
      maxAge: 15 * 60 * 1000, // 15 دقيقة
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      ...baseCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 أيام
      path: '/auth/refresh',
    });
  }
}
