import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { JwtPayload, UserLoginType } from './types/auth.types';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.users.findUnique({
      where: { email: loginDto.email },
      include: {
        employee: true,
        platform_admin: true,
        customer_profile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let type: UserLoginType = UserLoginType.CUSTOMER;
    let tenantId: string | undefined;

    if (user.platform_admin && user.platform_admin.is_active) {
      type = UserLoginType.PLATFORM_ADMIN;
    } else if (user.employee && user.employee.length > 0) {
      const activeEmployee = user.employee.find((e: any) => e.is_active);
      if (activeEmployee) {
        type = UserLoginType.EMPLOYEE;
        tenantId = activeEmployee.tenant_id;
      } else {
        throw new UnauthorizedException('Account deactivated');
      }
    } else if (user.customer_profile) {
      type = UserLoginType.CUSTOMER;
    } else {
      throw new UnauthorizedException('User profile not found');
    }

    const tokens = await this.generateTokens(user.id, type, tenantId);
    return { ...tokens, user: { id: user.id, email: user.email, type } };
  }

  async refreshToken(dto: RefreshTokenDto) {
    let payload: JwtPayload;

    // 1. التحقق من صحة التوكن (خارج الـ try/catch العام لتمييز خطأ التوكن)
    try {
      payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'super-refresh-secret',
      });
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // 2. من هنا تبدأ العمليات الخاصة بقاعدة البيانات
    const session = await this.prisma.user_session.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    const isTokenValid = await bcrypt.compare(
      dto.refreshToken,
      session.hashed_refresh_token,
    );

    if (!isTokenValid) {
      // ⚠️ أمنياً: تم اكتشاف محاولة استخدام توكن قديم أو مزيف لجلسة صحيحة
      // يجب تدمير الجلسة فوراً لحماية المستخدم
      await this.prisma.user_session.delete({ where: { id: session.id } });
      throw new UnauthorizedException(
        'Security alert: Invalid token signature',
      );
    }

    // 3. الدوران (Rotation): حذف الجلسة القديمة وإصدار توكنز جديدة
    await this.prisma.user_session.delete({ where: { id: session.id } });

    return await this.generateTokens(
      payload.sub,
      payload.type,
      payload.tenantId,
    );
  }
  async logout(sessionId: string) {
    await this.prisma.user_session.deleteMany({
      where: { id: sessionId },
    });
  }

  private async generateTokens(
    userId: string,
    type: UserLoginType,
    tenantId?: string,
  ) {
    const sessionId = crypto.randomUUID();

    const payload: JwtPayload = {
      sub: userId,
      sessionId,
      type,
      tenantId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'super-secret',
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'super-refresh-secret',
      expiresIn: '7d',
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.user_session.create({
      data: {
        id: sessionId,
        user_id: userId,
        hashed_refresh_token: hashedRefreshToken,
        expires_at: expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
