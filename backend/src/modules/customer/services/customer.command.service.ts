import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { Transactional } from '../../../packages/transaction';
import type { ICacheProvider } from '../../../core/cache/interfaces/ICacheProvider';
import { generateOtp } from '../../../common/helpers/generate-otp';
import { MailService } from '../../../infrastructure/mail/mail.service';
import { RegisterDto } from '../dtos/requests/register.dto';
import { ResendOtpDto } from '../dtos/requests/resend-otp.dto';
import { VerifyOtpDto } from '../dtos/requests/verify-otp.dto';
import type { ICustomerCommandRepository } from '../interfaces/customer.command.repository.interface';
import type { ICustomerCommandService } from '../interfaces/customer.command.service.interface';
import {
  CUSTOMER_CACHE_KEYS,
  CUSTOMER_CACHE_TTL,
  CUSTOMER_OTP_CONFIG,
  CUSTOMER_RESEND_CONFIG,
} from '../constants/customer.cache.constants';
import { CACHE_PROVIDER } from '../../../core/cache/tokens/cache.tokens';

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

@Injectable()
export class CustomerCommandService implements ICustomerCommandService {
  constructor(
    @Inject('ICustomerCommandRepository')
    private readonly customerCommandRepository: ICustomerCommandRepository,
    @Inject(CACHE_PROVIDER)
    private readonly cacheProvider: ICacheProvider,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const exists = await this.customerCommandRepository.existsByEmailOrPhone(
      dto.email,
      dto.phone,
    );

    if (exists) {
      throw new ConflictException('Email or phone already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const otp = generateOtp();
    const cacheKey = `${CUSTOMER_CACHE_KEYS.REGISTER_OTP_PREFIX}:${dto.email}`;
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
      await this.mailService.sendOtpEmail(dto.email, otp);
    } catch (err) {
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
    const cacheKey = `${CUSTOMER_CACHE_KEYS.REGISTER_OTP_PREFIX}:${dto.email}`;
    const pending = await this.cacheProvider.get<PendingRegistration>(cacheKey);

    if (!pending) {
      throw new BadRequestException(
        'No pending registration found for this email, please register again',
      );
    }

    if (pending.requestCount >= CUSTOMER_RESEND_CONFIG.MAX_REQUESTS) {
      throw new BadRequestException(
        'Maximum OTP requests reached, please register again',
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

    const updated: PendingRegistration = {
      ...pending,
      otp,
      attempts: 0,
      requestCount: pending.requestCount + 1,
      lastSentAt: now,
      expiresAt: now + CUSTOMER_CACHE_TTL.REGISTER_OTP * 1000,
    };

    await this.cacheProvider.set(
      cacheKey,
      updated,
      CUSTOMER_CACHE_TTL.REGISTER_OTP,
    );

    try {
      await this.mailService.sendOtpEmail(dto.email, otp);
    } catch (err) {
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
    const cacheKey = `${CUSTOMER_CACHE_KEYS.REGISTER_OTP_PREFIX}:${dto.email}`;
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
      email: dto.email,
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
}
