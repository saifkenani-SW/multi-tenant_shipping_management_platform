import { Injectable } from '@nestjs/common';
import {
  CacheKeyEntry,
  ICacheProvider,
} from '../../../core/cache/interfaces/ICacheProvider';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class InMemoryCacheProvider implements ICacheProvider {
  private readonly store = new Map<string, CacheEntry<any>>();

  async remember<T>(
    key: string,
    loader: () => Promise<T>,
    ttl = 300,
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await loader();

    await this.set(key, value, ttl);

    return value;
  }

  async rememberMany<T extends { id: string }>(
    cacheKeys: ReadonlyArray<CacheKeyEntry>,
    loader: (missingIds: readonly string[]) => Promise<readonly T[]>,
    ttl = 300,
  ): Promise<Map<string, T>> {
    if (cacheKeys.length === 0) {
      return new Map();
    }

    const cached = await this.getMany<T>(cacheKeys.map((entry) => entry.key));

    const missingIds = cacheKeys
      .filter((entry) => !cached.has(entry.key))
      .map((entry) => entry.id);

    if (missingIds.length > 0) {
      const loaded = await loader(missingIds);

      const keyMap = new Map(cacheKeys.map((entry) => [entry.id, entry.key]));

      const entries: Array<{
        key: string;
        value: T;
        ttl?: number;
      }> = [];

      for (const entity of loaded) {
        const key = keyMap.get(entity.id);

        if (!key) {
          continue;
        }

        entries.push({
          key,
          value: entity,
          ttl,
        });

        cached.set(key, entity);
      }

      await this.setMany(entries);
    }

    const result = new Map<string, T>();

    for (const entry of cacheKeys) {
      const entity = cached.get(entry.key);

      if (entity) {
        result.set(entry.id, entity);
      }
    }

    return result;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async getMany<T>(keys: readonly string[]): Promise<Map<string, T>> {
    const result = new Map<string, T>();

    for (const key of keys) {
      const value = await this.get<T>(key);

      if (value !== null) {
        result.set(key, value);
      }
    }

    return result;
  }

  async set<T>(key: string, value: T, ttl = 300): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  async setMany<T>(
    entries: ReadonlyArray<{
      key: string;
      value: T;
      ttl?: number;
    }>,
  ): Promise<void> {
    for (const entry of entries) {
      await this.set(entry.key, entry.value, entry.ttl);
    }
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    const regex = new RegExp(
      '^' +
        pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') +
        '$',
    );

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}
