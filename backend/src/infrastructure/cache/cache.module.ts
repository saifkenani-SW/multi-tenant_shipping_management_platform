// src/modules/cache/cache.module.ts
import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { Redis, RedisOptions } from 'ioredis';
import { RedisCacheProvider } from './providers/RedisCacheProvider';
import { InMemoryCacheProvider } from './providers/InMemoryCacheProvider';

export interface CacheModuleAsyncOptions {
  /** استخدم InMemory للـ Testing */
  useInMemory?: boolean;
  /** الـ Dependencies التي سيتم حقنها في useFactory (مثل ConfigService) */
  inject?: any[];
  /** دالة تُرجع إعدادات اتصال Redis */
  useFactory: (...args: any[]) => Promise<RedisOptions> | RedisOptions;
}

@Global() // يُفضل جعله Global لكي لا تضطر لاستدعائه في كل Module يحتاج كاش
@Module({})
export class CacheModule {
  static registerAsync(options: CacheModuleAsyncOptions): DynamicModule {
    // 1. حالة الـ In-Memory (للاختبارات)
    if (options.useInMemory) {
      return {
        module: CacheModule,
        providers: [
          { provide: 'ICacheProvider', useClass: InMemoryCacheProvider },
        ],
        exports: ['ICacheProvider'],
      };
    }

    // 2. مزود اتصال Redis الأساسي (يقرأ الإعدادات ويتصل)
    const redisProvider: Provider = {
      provide: 'REDIS_CLIENT',
      inject: options.inject || [],
      useFactory: async (...args: any[]) => {
        const redisOptions = await options.useFactory(...args);
        const client = new Redis(redisOptions);

        client.on('error', (err) =>
          console.error('🔴 Redis Client Error', err),
        );
        client.on('connect', () =>
          console.log('🟢 Redis connected successfully!'),
        );

        return client;
      },
    };

    // 3. مزود الـ Cache الذي يستخدم عميل Redis
    const cacheProvider: Provider = {
      provide: 'ICacheProvider',
      inject: ['REDIS_CLIENT'], // نحقن عميل رديس الذي أنشأناه بالأعلى
      useFactory: (redisClient: Redis) => {
        return new RedisCacheProvider(redisClient);
      },
    };

    return {
      module: CacheModule,
      providers: [redisProvider, cacheProvider],
      // نقوم بتصدير REDIS_CLIENT أيضاً في حال احتجناه لاحقاً لـ BullMQ مثلاً
      exports: ['ICacheProvider', 'REDIS_CLIENT'],
    };
  }
}
