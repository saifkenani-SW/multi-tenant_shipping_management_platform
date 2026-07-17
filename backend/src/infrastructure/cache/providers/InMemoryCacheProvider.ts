import { Injectable } from '@nestjs/common';
import { ICacheProvider } from '../../../core/cache/interfaces/ICacheProvider';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * InMemory implementation لـ ICacheProvider.
 * للاستخدام في:
 *  - Unit/Integration tests (بدون Redis)
 *  - Development بدون infrastructure
 *
 * ⚠️  لا تستخدمه في production — لا يدعم multi-instance sharing.
 */
@Injectable()
export class InMemoryCacheProvider implements ICacheProvider {
  private readonly store = new Map<string, CacheEntry<any>>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key); // lazy eviction
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl = 300): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    // نحوّل glob pattern لـ regex
    const regex = new RegExp(
      '^' +
        pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') +
        '$',
    );
    for (const key of this.store.keys()) {
      if (regex.test(key)) this.store.delete(key);
    }
  }

  async isHealthy(): Promise<boolean> {
    return true; // دائماً healthy في الـ tests
  }

  /** للـ testing فقط — يمسح كل الـ store */
  clear(): void {
    this.store.clear();
  }

  /** للـ testing — يعرض عدد الـ entries */
  size(): number {
    return this.store.size;
  }
}
