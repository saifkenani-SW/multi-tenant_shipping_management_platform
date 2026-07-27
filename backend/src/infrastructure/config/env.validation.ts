import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // أساسيات
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // قاعدة البيانات
  DATABASE_URL: Joi.string().required(),
  SHADOW_DATABASE_URL: Joi.string().optional(), // اختياري

  // أمان
  JWT_ACCESS_SECRET: Joi.string().required().min(32), // 32 حرف على الأقل
  JWT_EXPIRATION: Joi.string().default('7d'),

  // ريديس
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),

  // إعدادات الإيميل
  SMTP_HOST: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(), // مطلوب فقط في الإنتاج
    otherwise: Joi.optional(),
  }),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SMTP_PASS: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  // حدود
  RATE_LIMIT_TTL: Joi.number().default(60),
  RATE_LIMIT_MAX: Joi.number().default(100),
});
