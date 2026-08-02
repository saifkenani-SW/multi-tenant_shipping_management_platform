import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CustomerCommandService } from './customer.command.service';

describe('CustomerCommandService profile image upload', () => {
  const repository = {
    findProfileImageByUserId: jest.fn(),
    updateProfileImageKey: jest.fn(),
    findCustomerCredentialsByEmail: jest.fn(),
    findCustomerCredentialsByUserId: jest.fn(),
    updatePasswordAndRevokeSessions: jest.fn(),
  };
  const cache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
  const storage = { save: jest.fn(), delete: jest.fn() };
  const mail = {
    sendOtpEmail: jest.fn(),
    sendPasswordResetOtpEmail: jest.fn(),
  };
  const service = new CustomerCommandService(
    repository as any,
    cache as any,
    mail as any,
    storage as any,
  );
  const file = {
    originalname: 'avatar.anything',
    mimetype: 'image/webp',
    size: 5,
    buffer: Buffer.from('image'),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    cache.del.mockResolvedValue(undefined);
    cache.set.mockResolvedValue(undefined);
    storage.delete.mockResolvedValue(undefined);
    mail.sendOtpEmail.mockResolvedValue(undefined);
    mail.sendPasswordResetOtpEmail.mockResolvedValue(undefined);
  });

  it('stores the new image, updates the profile, deletes the old image, and invalidates cache', async () => {
    const updatedAt = new Date('2026-08-02T20:00:00.000Z');
    repository.findProfileImageByUserId.mockResolvedValue({
      profileId: 'profile-id',
      storageKey: 'profile-id/profile-image/old.jpg',
    });
    storage.save.mockResolvedValue({
      storage_key: 'profile-id/profile-image/new.webp',
    });
    repository.updateProfileImageKey.mockResolvedValue({
      profileId: 'profile-id',
      updatedAt,
    });

    const result = await service.uploadProfileImage('user-id', file);

    expect(storage.save).toHaveBeenCalledWith(
      expect.objectContaining({ originalname: 'profile.webp' }),
      'profile-id',
      'profile-image',
    );
    expect(repository.updateProfileImageKey).toHaveBeenCalledWith(
      'user-id',
      'profile-id/profile-image/new.webp',
    );
    expect(storage.delete).toHaveBeenCalledWith(
      'profile-id/profile-image/old.jpg',
    );
    expect(cache.del).toHaveBeenCalledWith('customer:profile:user-id');
    expect(result.profileImageUrl).toBe(
      `/customer/profile-image/profile-id?v=${updatedAt.getTime()}`,
    );
  });

  it('removes the newly saved file when updating the database fails', async () => {
    repository.findProfileImageByUserId.mockResolvedValue({
      profileId: 'profile-id',
      storageKey: null,
    });
    storage.save.mockResolvedValue({
      storage_key: 'profile-id/profile-image/new.webp',
    });
    repository.updateProfileImageKey.mockRejectedValue(new Error('db failed'));

    await expect(service.uploadProfileImage('user-id', file)).rejects.toThrow(
      'db failed',
    );

    expect(storage.delete).toHaveBeenCalledWith(
      'profile-id/profile-image/new.webp',
    );
    expect(cache.del).not.toHaveBeenCalled();
  });

  it('resends a registration OTP after the cooldown and normalizes the email', async () => {
    cache.get.mockResolvedValue({
      fullName: 'Customer',
      phone: '0999999999',
      passwordHash: 'hash',
      otp: '111111',
      attempts: 0,
      requestCount: 1,
      lastSentAt: Date.now() - 61_000,
      expiresAt: Date.now() + 500_000,
    });

    await expect(
      service.resendOtp({ email: ' Customer@Example.com ' }),
    ).resolves.toEqual({
      message: 'A new OTP has been sent to your email, valid for 10 minutes',
    });

    expect(cache.get).toHaveBeenCalledWith(
      'customer:register:otp:customer@example.com',
    );
    expect(mail.sendOtpEmail).toHaveBeenCalledWith(
      'customer@example.com',
      expect.stringMatching(/^\d{6}$/),
    );
  });

  it('returns the real resend cooldown reason instead of a generic bad request', async () => {
    cache.get.mockResolvedValue({
      fullName: 'Customer',
      phone: '0999999999',
      passwordHash: 'hash',
      otp: '111111',
      attempts: 0,
      requestCount: 1,
      lastSentAt: Date.now(),
      expiresAt: Date.now() + 500_000,
    });

    await expect(
      service.resendOtp({ email: 'customer@example.com' }),
    ).rejects.toThrow(/Please wait \d+ seconds/);
  });

  it('resends a password-reset OTP when there is no pending registration', async () => {
    cache.get.mockResolvedValueOnce(null).mockResolvedValueOnce({
      userId: 'user-id',
      otp: '111111',
      attempts: 0,
      requestCount: 1,
      lastSentAt: Date.now() - 61_000,
      expiresAt: Date.now() + 500_000,
    });

    await service.resendOtp({ email: 'customer@example.com' });

    expect(mail.sendPasswordResetOtpEmail).toHaveBeenCalledWith(
      'customer@example.com',
      expect.stringMatching(/^\d{6}$/),
    );
  });

  it('creates a password reset OTP without exposing whether other emails exist', async () => {
    repository.findCustomerCredentialsByEmail.mockResolvedValue({
      userId: 'user-id',
      passwordHash: 'hash',
    });
    cache.get.mockResolvedValue(null);

    const result = await service.forgotPassword({
      email: 'CUSTOMER@example.com',
    });

    expect(result.message).toContain('If a customer account exists');
    expect(mail.sendPasswordResetOtpEmail).toHaveBeenCalledWith(
      'customer@example.com',
      expect.stringMatching(/^\d{6}$/),
    );
  });

  it('resets the password and revokes existing sessions with a valid OTP', async () => {
    const currentHash = await bcrypt.hash('currentPassword123', 4);
    cache.get.mockResolvedValue({
      userId: 'user-id',
      otp: '123456',
      attempts: 0,
      requestCount: 1,
      lastSentAt: Date.now(),
      expiresAt: Date.now() + 500_000,
    });
    repository.findCustomerCredentialsByUserId.mockResolvedValue({
      userId: 'user-id',
      passwordHash: currentHash,
    });
    repository.updatePasswordAndRevokeSessions.mockResolvedValue(undefined);

    await expect(
      service.resetPassword({
        email: 'customer@example.com',
        otp: '123456',
        newPassword: 'newPassword123',
      }),
    ).resolves.toEqual({
      message: 'Password reset successfully. Please log in again',
    });

    expect(repository.updatePasswordAndRevokeSessions).toHaveBeenCalledWith(
      'user-id',
      expect.any(String),
    );
    expect(cache.del).toHaveBeenCalledWith(
      'customer:password-reset:otp:customer@example.com',
    );
  });

  it('rejects change-password when the current password is wrong', async () => {
    const currentHash = await bcrypt.hash('currentPassword123', 4);
    repository.findCustomerCredentialsByUserId.mockResolvedValue({
      userId: 'user-id',
      passwordHash: currentHash,
    });

    await expect(
      service.changePassword('user-id', {
        currentPassword: 'wrongPassword123',
        newPassword: 'newPassword123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.updatePasswordAndRevokeSessions).not.toHaveBeenCalled();
  });
});
