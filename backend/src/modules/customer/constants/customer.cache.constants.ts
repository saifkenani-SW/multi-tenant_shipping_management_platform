export const CUSTOMER_CACHE_KEYS = {
  PREFIX: 'customer',
  REGISTER_OTP_PREFIX: 'customer:register:otp',
  PASSWORD_RESET_OTP_PREFIX: 'customer:password-reset:otp',
  PROFILE: 'customer:profile',
};

export const CUSTOMER_CACHE_TTL = {
  REGISTER_OTP: 600, // 10 دقايق
  PASSWORD_RESET_OTP: 600,
  PROFILE: 300,
};

export const CUSTOMER_OTP_CONFIG = {
  LENGTH: 6,
  MAX_ATTEMPTS: 5,
};

export const CUSTOMER_RESEND_CONFIG = {
  MAX_REQUESTS: 3, // 1 أساسي (register) + محاولتي resend
  COOLDOWNS_SECONDS: [60, 60],
};

export const CUSTOMER_PROFILE_IMAGE = {
  CATEGORY: 'profile-image',
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
};

export const buildCustomerProfileImageUrl = (
  profileId: string,
  updatedAt: Date | string,
): string =>
  `/customer/profile-image/${profileId}?v=${new Date(updatedAt).getTime()}`;
