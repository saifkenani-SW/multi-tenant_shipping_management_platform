import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { Redis, RedisOptions } from 'ioredis';

import { RedisCacheProvider } from './providers/RedisCacheProvider';
import { InMemoryCacheProvider } from './providers/InMemoryCacheProvider';


import { CacheContainerInitializer } from './container/CacheContainerInitializer';

import {
  CACHE_FACADE,
  CACHE_KEY_BUILDER,
  CACHE_PROVIDER,
} from '../../core/cache/tokens/cache.tokens';
import { CacheKeyBuilder } from './builders/CacheKeyBuilder';
import { CacheFacade } from './facade/CacheFacade';

export interface CacheModuleAsyncOptions {
  useInMemory?: boolean;

  inject?: any[];

  useFactory: (...args: any[]) => Promise<RedisOptions> | RedisOptions;
}

@Global()
@Module({})
export class CacheModule {
  static registerAsync(options: CacheModuleAsyncOptions): DynamicModule {
    // ==========================
    // In-Memory
    // ==========================
    if (options.useInMemory) {
      return {
        module: CacheModule,
        providers: [
          {
            provide: CACHE_PROVIDER,
            useClass: InMemoryCacheProvider,
          },
          {
            provide: CACHE_KEY_BUILDER,
            useClass: CacheKeyBuilder,
          },
          {
            provide: CACHE_FACADE,
            useClass: CacheFacade,
          },
          CacheContainerInitializer,
        ],
        exports: [CACHE_PROVIDER, CACHE_KEY_BUILDER, CACHE_FACADE],
      };
    }

    // ==========================
    // Redis Client
    // ==========================
    const redisProvider: Provider = {
      provide: 'REDIS_CLIENT',
      inject: options.inject ?? [],
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

    // ==========================
    // Cache Provider
    // ==========================
    const cacheProvider: Provider = {
      provide: CACHE_PROVIDER,
      inject: ['REDIS_CLIENT'],
      useFactory: (redis: Redis) => new RedisCacheProvider(redis),
    };

    // ==========================
    // Module
    // ==========================
    return {
      module: CacheModule,
      providers: [
        redisProvider,
        cacheProvider,

        {
          provide: CACHE_KEY_BUILDER,
          useClass: CacheKeyBuilder,
        },

        {
          provide: CACHE_FACADE,
          useClass: CacheFacade,
        },

        CacheContainerInitializer,
      ],

      exports: [
        CACHE_PROVIDER,
        CACHE_KEY_BUILDER,
        CACHE_FACADE,
        'REDIS_CLIENT',
      ],
    };
  }
}
