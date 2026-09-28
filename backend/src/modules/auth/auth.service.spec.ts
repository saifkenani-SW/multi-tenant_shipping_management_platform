import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UserFacade } from '../user/application/facades/user.facade';
import { NotificationFacade } from '../notification/facades/notification.facade';
import { UserLoginType } from './types/auth.types';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService (Performance & Compatibility)', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let userFacade: any;
  let notificationFacade: any;

  const mockUser = {
    userId: 'user-uuid-1',
    passwordHash: '',
    profiles: [
      {
        type: UserLoginType.PLATFORM_OWNER,
        isActive: true,
      },
    ],
  };

  beforeAll(async () => {
    mockUser.passwordHash = await bcrypt.hash('password123', 10);
  });

  beforeEach(async () => {
    prisma = {
      user_session: {
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
        delete: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({}),
      },
      organization_unit: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn(),
    };

    userFacade = {
      getIdentityByEmail: jest.fn(),
    };

    notificationFacade = {
      registerToken: jest.fn().mockResolvedValue(undefined),
      subscribeTokenToTopics: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: UserFacade, useValue: userFacade },
        { provide: NotificationFacade, useValue: notificationFacade },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should login successfully without fcmToken and return tokens quickly', async () => {
      userFacade.getIdentityByEmail.mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'owner@logisticsplatform.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toEqual({
        id: 'user-uuid-1',
        email: 'owner@logisticsplatform.com',
        type: UserLoginType.PLATFORM_OWNER,
        tenantId: undefined,
      });

      // Verify that prisma user_session.create stored a 64-char SHA-256 hex string (not bcrypt)
      expect(prisma.user_session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-uuid-1',
          hashed_refresh_token: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
      });

      // No FCM operations should be called
      expect(notificationFacade.registerToken).not.toHaveBeenCalled();
    });

    it('should login successfully with fcmToken without blocking response', async () => {
      userFacade.getIdentityByEmail.mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'owner@logisticsplatform.com',
        password: 'password123',
        fcmToken: 'test-fcm-token-123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');

      // Wait for background setImmediate to run
      await new Promise((resolve) => setImmediate(resolve));

      expect(notificationFacade.registerToken).toHaveBeenCalledWith(
        'user-uuid-1',
        'test-fcm-token-123',
      );
      expect(notificationFacade.subscribeTokenToTopics).toHaveBeenCalledWith(
        'test-fcm-token-123',
        ['companies'],
      );
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      userFacade.getIdentityByEmail.mockResolvedValue(mockUser);

      await expect(
        service.login({
          email: 'owner@logisticsplatform.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken (SHA-256 vs Legacy Bcrypt)', () => {
    it('should verify modern SHA-256 hashed refresh tokens', async () => {
      const plainToken = 'my-refresh-token-modern';
      const sha256Hash = crypto
        .createHash('sha256')
        .update(plainToken)
        .digest('hex');

      jwtService.verify.mockReturnValue({
        sub: 'user-uuid-1',
        sessionId: 'session-123',
        type: UserLoginType.PLATFORM_OWNER,
      });

      prisma.user_session.findUnique.mockResolvedValue({
        id: 'session-123',
        hashed_refresh_token: sha256Hash,
      });

      const result = await service.refreshToken({ refreshToken: plainToken });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prisma.user_session.delete).toHaveBeenCalledWith({
        where: { id: 'session-123' },
      });
    });

    it('should maintain backward compatibility with legacy bcrypt hashed tokens', async () => {
      const plainToken = 'my-refresh-token-legacy';
      const bcryptHash = await bcrypt.hash(plainToken, 10);

      jwtService.verify.mockReturnValue({
        sub: 'user-uuid-1',
        sessionId: 'session-123',
        type: UserLoginType.PLATFORM_OWNER,
      });

      prisma.user_session.findUnique.mockResolvedValue({
        id: 'session-123',
        hashed_refresh_token: bcryptHash,
      });

      const result = await service.refreshToken({ refreshToken: plainToken });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prisma.user_session.delete).toHaveBeenCalledWith({
        where: { id: 'session-123' },
      });
    });

    it('should reject invalid refresh token and delete session', async () => {
      const plainToken = 'invalid-token';
      const sha256Hash = crypto
        .createHash('sha256')
        .update('correct-token')
        .digest('hex');

      jwtService.verify.mockReturnValue({
        sub: 'user-uuid-1',
        sessionId: 'session-123',
      });

      prisma.user_session.findUnique.mockResolvedValue({
        id: 'session-123',
        hashed_refresh_token: sha256Hash,
      });

      await expect(
        service.refreshToken({ refreshToken: plainToken }),
      ).rejects.toThrow(UnauthorizedException);

      expect(prisma.user_session.delete).toHaveBeenCalledWith({
        where: { id: 'session-123' },
      });
    });
  });
});
