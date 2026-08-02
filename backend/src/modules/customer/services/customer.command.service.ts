import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { Transactional } from '../../../packages/transaction';
import type { ICacheProvider } from '../../../core/cache/interfaces/ICacheProvider';
import { generateOtp } from '../../../common/helpers/generate-otp';
import { MailService } from '../../../infrastructure/mail/mail.service';
import { RegisterDto } from '../dtos/requests/register.dto';
import { ResendOtpDto } from '../dtos/requests/resend-otp.dto';
import { VerifyOtpDto } from '../dtos/requests/verify-otp.dto';
import { ForgotPasswordDto } from '../dtos/requests/forgot-password.dto';
import { ResetPasswordDto } from '../dtos/requests/reset-password.dto';
import { ChangePasswordDto } from '../dtos/requests/change-password.dto';
import type { ICustomerCommandRepository } from '../interfaces/customer.command.repository.interface';
import type { ICustomerCommandService } from '../interfaces/customer.command.service.interface';
import {
  CUSTOMER_CACHE_KEYS,
  CUSTOMER_CACHE_TTL,
  CUSTOMER_OTP_CONFIG,
  CUSTOMER_PROFILE_IMAGE,
  CUSTOMER_RESEND_CONFIG,
  buildCustomerProfileImageUrl,
} from '../constants/customer.cache.constants';
import { CACHE_PROVIDER } from '../../../core/cache/tokens/cache.tokens';
import type {
  IStorageProvider,
  StorageFile,
} from '../../../packages/storage/src/contracts/storage-provider.interface';
import { STORAGE_PROVIDER } from '../../../packages/storage/src/constants/storage.constants';
import { UploadProfileImageResponseDto } from '../dtos/responses/upload-profile-image.dto';

const IMAGE_EXTENSIONS: Readonly<Record<string, string>> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

interface PendingRegistration {
  fullName: string;
  phone: string;
  passwordHash: string;
  otp: string;
  attempts: number;
  requestCount: number;
  lastSentAt: number;
  expiresAt: number;
}

interface PendingPasswordReset {
  userId: string;
  otp: string;
  attempts: number;
  requestCount: number;
  lastSentAt: number;
  expiresAt: number;
}

type PendingOtp = PendingRegistration | PendingPasswordReset;
type OtpPurpose = 'registration' | 'password-reset';

@Injectable()
export class CustomerCommandService implements ICustomerCommandService {
  private readonly logger = new Logger(CustomerCommandService.name);

  constructor(
    @Inject('ICustomerCommandRepository')
    private readonly customerCommandRepository: ICustomerCommandRepository,
    @Inject(CACHE_PROVIDER)
    private readonly cacheProvider: ICacheProvider,
    private readonly mailService: MailService,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const email = this.normalizeEmail(dto.email);
    const exists = await this.customerCommandRepository.existsByEmailOrPhone(
      email,
      dto.phone,
    );

    if (exists) {
      throw new ConflictException('Email or phone already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const otp = generateOtp();
    const cacheKey = `${CUSTOMER_CACHE_KEYS.REGISTER_OTP_PREFIX}:${email}`;
    const now = Date.now();

    const pending: PendingRegistration = {
      fullName: dto.fullName,
      phone: dto.phone,
      passwordHash,
      otp,
      attempts: 0,
      requestCount: 1,
      lastSentAt: now,
      expiresAt: now + CUSTOMER_CACHE_TTL.REGISTER_OTP * 1000,
    };

    await this.cacheProvider.set(
      cacheKey,
      pending,
      CUSTOMER_CACHE_TTL.REGISTER_OTP,
    );

    try {
      await this.mailService.sendOtpEmail(email, otp);
    } catch {
      await this.cacheProvider.del(cacheKey);
      throw new InternalServerErrorException(
        'Failed to send verification email, please try again',
      );
    }

    return {
      message: 'OTP sent to your email, valid for 10 minutes',
    };
  }

  async resendOtp(dto: ResendOtpDto): Promise<{ message: string }> {
    const email = this.normalizeEmail(dto.email);
    const registrationKey = `${CUSTOMER_CACHE_KEYS.REGISTER_OTP_PREFIX}:${email}`;
    const passwordResetKey = `${CUSTOMER_CACHE_KEYS.PASSWORD_RESET_OTP_PREFIX}:${email}`;
    const pendingRegistration =
      await this.cacheProvider.get<PendingRegistration>(registrationKey);
    const pendingPasswordReset = pendingRegistration
      ? null
      : await this.cacheProvider.get<PendingPasswordReset>(passwordResetKey);
    const pending = pendingRegistration ?? pendingPasswordReset;

    if (!pending) {
      throw new BadRequestException(
        'No pending OTP request found for this email. Start the registration or password reset flow again',
      );
    }

    const purpose: OtpPurpose = pendingRegistration
      ? 'registration'
      : 'password-reset';
    const cacheKey = pendingRegistration ? registrationKey : passwordResetKey;

    if (pending.requestCount >= CUSTOMER_RESEND_CONFIG.MAX_REQUESTS) {
      throw new BadRequestException(
        'Maximum OTP requests reached. Start the flow again',
      );
    }

    const requiredWaitSeconds =
      CUSTOMER_RESEND_CONFIG.COOLDOWNS_SECONDS[pending.requestCount - 1];
    const elapsedSeconds = (Date.now() - pending.lastSentAt) / 1000;

    if (elapsedSeconds < requiredWaitSeconds) {
      const remaining = Math.ceil(requiredWaitSeconds - elapsedSeconds);
      throw new BadRequestException(
        `Please wait ${remaining} seconds before requesting a new code`,
      );
    }

    const otp = generateOtp();
    const now = Date.now();
    const ttl =
      purpose === 'registration'
        ? CUSTOMER_CACHE_TTL.REGISTER_OTP
        : CUSTOMER_CACHE_TTL.PASSWORD_RESET_OTP;

    const updated: PendingOtp = {
      ...pending,
      otp,
      attempts: 0,
      requestCount: pending.requestCount + 1,
      lastSentAt: now,
      expiresAt: now + ttl * 1000,
    };

    await this.cacheProvider.set(cacheKey, updated, ttl);

    try {
      await this.sendOtpEmail(email, otp, purpose);
    } catch {
      const previousTtl = Math.max(
        1,
        Math.ceil((pending.expiresAt - Date.now()) / 1000),
      );
      await this.cacheProvider.set(cacheKey, pending, previousTtl);
      throw new InternalServerErrorException(
        'Failed to send verification email, please try again',
      );
    }

    return {
      message: 'A new OTP has been sent to your email, valid for 10 minutes',
    };
  }

  @Transactional()
  async verifyOtp(dto: VerifyOtpDto): Promise<{ message: string }> {
    const email = this.normalizeEmail(dto.email);
    const cacheKey = `${CUSTOMER_CACHE_KEYS.REGISTER_OTP_PREFIX}:${email}`;
    const pending = await this.cacheProvider.get<PendingRegistration>(cacheKey);

    if (!pending) {
      throw new BadRequestException(
        'OTP expired or not found, please register again',
      );
    }

    if (pending.attempts >= CUSTOMER_OTP_CONFIG.MAX_ATTEMPTS) {
      await this.cacheProvider.del(cacheKey);
      throw new BadRequestException(
        'Too many failed attempts, please register again',
      );
    }

    if (pending.otp !== dto.otp) {
      const updated: PendingRegistration = {
        ...pending,
        attempts: pending.attempts + 1,
      };
      const remainingTtl = Math.max(
        1,
        Math.ceil((pending.expiresAt - Date.now()) / 1000),
      );
      await this.cacheProvider.set(cacheKey, updated, remainingTtl);

      const attemptsLeft = CUSTOMER_OTP_CONFIG.MAX_ATTEMPTS - updated.attempts;
      throw new BadRequestException(
        `Invalid OTP, ${attemptsLeft} attempts remaining`,
      );
    }

    // إنشاء الحساب فقط — بدون تسجيل دخول تلقائي، المستخدم بيسجل دخول لحاله بعدين عبر /auth/login
    const user = await this.customerCommandRepository.createUser({
      email,
      phone: pending.phone,
      passwordHash: pending.passwordHash,
    });

    await this.customerCommandRepository.createProfile({
      userId: user.id,
      fullName: pending.fullName,
      phone: pending.phone,
    });

    await this.cacheProvider.del(cacheKey);

    return {
      message: 'Account created successfully, please log in',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const email = this.normalizeEmail(dto.email);
    const credentials =
      await this.customerCommandRepository.findCustomerCredentialsByEmail(
        email,
      );
    const response = {
      message:
        'If a customer account exists for this email, a password reset OTP has been sent',
    };

    if (!credentials) return response;

    const cacheKey = `${CUSTOMER_CACHE_KEYS.PASSWORD_RESET_OTP_PREFIX}:${email}`;
    const existing =
      await this.cacheProvider.get<PendingPasswordReset>(cacheKey);

    if (existing) return response;

    const otp = generateOtp();
    const now = Date.now();
    const pending: PendingPasswordReset = {
      userId: credentials.userId,
      otp,
      attempts: 0,
      requestCount: 1,
      lastSentAt: now,
      expiresAt: now + CUSTOMER_CACHE_TTL.PASSWORD_RESET_OTP * 1000,
    };

    await this.cacheProvider.set(
      cacheKey,
      pending,
      CUSTOMER_CACHE_TTL.PASSWORD_RESET_OTP,
    );

    try {
      await this.mailService.sendPasswordResetOtpEmail(email, otp);
    } catch {
      await this.cacheProvider.del(cacheKey);
      throw new InternalServerErrorException(
        'Failed to send password reset email, please try again',
      );
    }

    return response;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const email = this.normalizeEmail(dto.email);
    const cacheKey = `${CUSTOMER_CACHE_KEYS.PASSWORD_RESET_OTP_PREFIX}:${email}`;
    const pending =
      await this.cacheProvider.get<PendingPasswordReset>(cacheKey);

    if (!pending) {
      throw new BadRequestException(
        'Password reset OTP expired or not found. Request a new code',
      );
    }

    if (pending.attempts >= CUSTOMER_OTP_CONFIG.MAX_ATTEMPTS) {
      await this.cacheProvider.del(cacheKey);
      throw new BadRequestException(
        'Too many failed attempts. Start password reset again',
      );
    }

    if (pending.otp !== dto.otp) {
      const updated: PendingPasswordReset = {
        ...pending,
        attempts: pending.attempts + 1,
      };
      const remainingTtl = Math.max(
        1,
        Math.ceil((pending.expiresAt - Date.now()) / 1000),
      );
      await this.cacheProvider.set(cacheKey, updated, remainingTtl);

      throw new BadRequestException(
        `Invalid OTP, ${CUSTOMER_OTP_CONFIG.MAX_ATTEMPTS - updated.attempts} attempts remaining`,
      );
    }

    const credentials =
      await this.customerCommandRepository.findCustomerCredentialsByUserId(
        pending.userId,
      );

    if (!credentials) {
      await this.cacheProvider.del(cacheKey);
      throw new BadRequestException('Customer account no longer exists');
    }

    if (await bcrypt.compare(dto.newPassword, credentials.passwordHash)) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.customerCommandRepository.updatePasswordAndRevokeSessions(
      pending.userId,
      passwordHash,
    );
    await this.cacheProvider.del(cacheKey);

    return { message: 'Password reset successfully. Please log in again' };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const credentials =
      await this.customerCommandRepository.findCustomerCredentialsByUserId(
        userId,
      );

    if (!credentials) {
      throw new NotFoundException('Customer account not found');
    }

    const currentPasswordMatches = await bcrypt.compare(
      dto.currentPassword,
      credentials.passwordHash,
    );

    if (!currentPasswordMatches) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (await bcrypt.compare(dto.newPassword, credentials.passwordHash)) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.customerCommandRepository.updatePasswordAndRevokeSessions(
      userId,
      passwordHash,
    );

    return { message: 'Password changed successfully. Please log in again' };
  }

  async uploadProfileImage(
    userId: string,
    file: StorageFile,
  ): Promise<UploadProfileImageResponseDto> {
    const currentProfile =
      await this.customerCommandRepository.findProfileImageByUserId(userId);

    if (!currentProfile) {
      throw new NotFoundException('Customer profile not found');
    }

    const extension = IMAGE_EXTENSIONS[file.mimetype];

    if (!extension) {
      throw new BadRequestException(
        'Only JPEG, PNG, and WebP images are allowed',
      );
    }

    const normalizedFile: StorageFile = {
      ...file,
      originalname: `profile${extension}`,
    };
    const saved = await this.storageProvider.save(
      normalizedFile,
      currentProfile.profileId,
      CUSTOMER_PROFILE_IMAGE.CATEGORY,
    );

    let updatedProfile: { profileId: string; updatedAt: Date };

    try {
      updatedProfile =
        await this.customerCommandRepository.updateProfileImageKey(
          userId,
          saved.storage_key,
        );
    } catch (error) {
      await this.storageProvider
        .delete(saved.storage_key)
        .catch(() => undefined);
      throw error;
    }

    if (
      currentProfile.storageKey &&
      currentProfile.storageKey !== saved.storage_key
    ) {
      await this.storageProvider
        .delete(currentProfile.storageKey)
        .catch((error) =>
          this.logger.warn(
            `Could not delete previous profile image: ${error instanceof Error ? error.message : String(error)}`,
          ),
        );
    }

    await this.cacheProvider
      .del(`${CUSTOMER_CACHE_KEYS.PROFILE}:${userId}`)
      .catch((error) =>
        this.logger.warn(
          `Could not invalidate customer profile cache: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );

    return {
      profileImageUrl: buildCustomerProfileImageUrl(
        updatedProfile.profileId,
        updatedProfile.updatedAt,
      ),
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async sendOtpEmail(
    email: string,
    otp: string,
    purpose: OtpPurpose,
  ): Promise<void> {
    if (purpose === 'password-reset') {
      await this.mailService.sendPasswordResetOtpEmail(email, otp);
      return;
    }

    await this.mailService.sendOtpEmail(email, otp);
  }
}
