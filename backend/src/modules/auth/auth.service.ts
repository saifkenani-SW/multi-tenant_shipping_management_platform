import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { SelectProfileDto } from './dtos/select-profile.dto';
import { JwtPayload, UserLoginType } from './types/auth.types';
import { generateUuid } from '../../common/uuid';
import { UserFacade } from '../user/application/facades/user.facade';
import { NotificationFacade } from '../notification/facades/notification.facade';
import { UserProfileInfo } from '../user/application/services/user.query.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly userFacade: UserFacade,
    private readonly notificationFacade: NotificationFacade,
  ) {}

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();
    const identity = await this.userFacade.getIdentityByEmail(email);

    if (!identity) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      identity.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const activeProfiles = identity.profiles.filter((p) => p.isActive);

    if (activeProfiles.length === 0) {
      throw new UnauthorizedException(
        'Account deactivated or no active profiles found',
      );
    }

    // If user provided a specific profile type at login, try to match it directly
    if (loginDto.type) {
      const requestedProfile = activeProfiles.find((p) => {
        if (
          p.type === UserLoginType.PLATFORM_OWNER ||
          p.type === UserLoginType.CUSTOMER
        ) {
          return p.type === loginDto.type;
        }
        return (
          p.type === loginDto.type &&
          (!loginDto.tenantId || p.tenantId === loginDto.tenantId)
        );
      });

      if (!requestedProfile) {
        throw new UnauthorizedException(
          'Requested profile is invalid or inactive',
        );
      }

      // Handle FCM Subscription
      await this.handleFcmTokenSubscription(identity.userId, loginDto.fcmToken, [requestedProfile]);

      const tokens = await this.generateTokens(
        identity.userId,
        requestedProfile.type,
        requestedProfile.tenantId,
        requestedProfile.profileId || requestedProfile.employeeId,
        requestedProfile.vehicleId,
      );
      return {
        ...tokens,
        user: {
          id: identity.userId,
          email,
          type: requestedProfile.type,
          tenantId: requestedProfile.tenantId,
        },
      };
    }

    // If only one profile, log them in directly
    if (activeProfiles.length === 1) {
      const profile = activeProfiles[0];
      
      // Handle FCM Subscription
      await this.handleFcmTokenSubscription(identity.userId, loginDto.fcmToken, [profile]);
      const tokens = await this.generateTokens(
        identity.userId,
        profile.type,
        profile.tenantId,
        profile.profileId || profile.employeeId,
        profile.vehicleId,
      );
      return {
        ...tokens,
        user: {
          id: identity.userId,
          email,
          type: profile.type,
          tenantId: profile.tenantId,
        },
      };
    }

    // Multiple profiles: return a session token to select a profile
    const sessionToken = this.jwtService.sign(
      { sub: identity.userId, isSessionToken: true },
      {
        secret: process.env.JWT_ACCESS_SECRET || 'super-secret',
        expiresIn: '15m',
      },
    );

    // Handle FCM Subscription for all active profiles
    await this.handleFcmTokenSubscription(identity.userId, loginDto.fcmToken, activeProfiles);

    const profilesForClient = activeProfiles.map((p) => ({
      type: p.type,
      tenantId: p.tenantId,
      isActive: p.isActive,
    }));

    return {
      status: 'REQUIRE_PROFILE_SELECTION',
      sessionToken,
      profiles: profilesForClient,
      user: { id: identity.userId, email },
    };
  }

  async selectProfile(userId: string, selectProfileDto: SelectProfileDto) {
    // 1. Find user and their profiles via Facade (to ensure they actually own this profile)
    // We need the email to use getIdentityByEmail. Let's fetch the email from DB directly or just use a generic query
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const identity = await this.userFacade.getIdentityByEmail(user.email);
    if (!identity) throw new UnauthorizedException('Identity not found');

    // 2. Verify that the requested profile exists and is active for this user
    const requestedProfile = identity.profiles.find((p) => {
      if (
        p.type === UserLoginType.PLATFORM_OWNER ||
        p.type === UserLoginType.CUSTOMER
      ) {
        return p.type === selectProfileDto.type && p.isActive;
      }
      return (
        p.type === selectProfileDto.type &&
        p.tenantId === selectProfileDto.tenantId &&
        p.isActive
      );
    });

    if (!requestedProfile) {
      throw new UnauthorizedException('Invalid or inactive profile selected');
    }

    // 3. Generate final tokens
    const tokens = await this.generateTokens(
      userId,
      requestedProfile.type,
      requestedProfile.tenantId,
      requestedProfile.profileId || requestedProfile.employeeId,
      requestedProfile.vehicleId,
    );
    return {
      ...tokens,
      user: {
        id: userId,
        email: user.email,
        type: requestedProfile.type,
        tenantId: requestedProfile.tenantId,
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    let payload: JwtPayload;

    // 1. التحقق من صحة التوكن (خارج الـ try/catch العام لتمييز خطأ التوكن)
    try {
      payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'super-refresh-secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh tokens');
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
        'Security alert: Invalid tokens signature',
      );
    }

    // 3. الدوران (Rotation): حذف الجلسة القديمة وإصدار توكنز جديدة
    await this.prisma.user_session.delete({ where: { id: session.id } });

    return await this.generateTokens(
      payload.sub,
      payload.type,
      payload.tenantId,
      payload.profileId,
      payload.vehicleId,
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
    profileId?: string,
    vehicleId?: string,
  ) {
    const sessionId = generateUuid();

    const payload: JwtPayload = {
      sub: userId,
      sessionId,
      type,
      tenantId,
      profileId,
      vehicleId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'super-secret',
      expiresIn: '1d',
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

  private async handleFcmTokenSubscription(
    userId: string,
    fcmToken: string,
    profiles: UserProfileInfo[],
  ) {
    if (!fcmToken) return;

    // 1. Register token
    await this.notificationFacade.registerToken(userId, fcmToken);

    // 2. Send welcome notification
    await this.notificationFacade.notifyUser(userId, {
      title: 'مرحباً بك',
      body: 'مرحباً بك في المنصة',
    });

    const topicsToSubscribe = new Set<string>();

    for (const profile of profiles) {
      if (profile.type === UserLoginType.PLATFORM_OWNER) {
        topicsToSubscribe.add('companies');
      }

      if (profile.type === UserLoginType.TENANT_ADMIN) {
        topicsToSubscribe.add('admins');
        if (profile.tenantId) {
          topicsToSubscribe.add(`tenant_${profile.tenantId}_admins`);
          // Get branches
          const branches = await this.prisma.organization_unit.findMany({
            where: { tenant_id: profile.tenantId },
            select: { id: true },
          });
          for (const branch of branches) {
            topicsToSubscribe.add(
              `tenant_${profile.tenantId}_branch_${branch.id}_admins`,
            );
          }
        }
      }

      if (
        profile.type === UserLoginType.EMPLOYEE ||
        profile.type === UserLoginType.DRIVER
      ) {
        topicsToSubscribe.add('employees');
        if (profile.tenantId) {
          topicsToSubscribe.add(`tenant_${profile.tenantId}_employees`);
        }
      }
    }

    if (topicsToSubscribe.size > 0) {
      await this.notificationFacade.subscribeTokenToTopics(
        fcmToken,
        Array.from(topicsToSubscribe),
      );
    }
  }
}
