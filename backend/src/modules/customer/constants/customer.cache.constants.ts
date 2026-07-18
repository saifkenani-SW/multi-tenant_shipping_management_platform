export const CUSTOMER_CACHE_KEYS = {
  PREFIX: 'customer',
  REGISTER_OTP_PREFIX: 'customer:register:otp',
  PROFILE: 'customer:profile',
};

export const CUSTOMER_CACHE_TTL = {
  REGISTER_OTP: 600, // 10 دقايق
  PROFILE: 300,
};

export const CUSTOMER_OTP_CONFIG = {
  LENGTH: 6,
  MAX_ATTEMPTS: 5,
};

export const CUSTOMER_RESEND_CONFIG = {
  MAX_REQUESTS: 3, // 1 أساسي (register) + محاولتي resend
  COOLDOWNS_SECONDS: [180, 300], // 3 دقايق قبل الطلب الثاني، 5 دقايق قبل الطلب الثالث
};
