import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis, RedisOptions } from 'ioredis';
import { ServerOptions } from 'socket.io';

/**
 * Socket.IO adapter backed by Redis pub/sub.
 *
 * Using two dedicated Redis connections (pub + sub) ensures the adapter
 * never interferes with the application's cache connection.
 * Both clients are created from the same RedisOptions, keeping
 * configuration centralised.
 */
export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis(options: RedisOptions): Promise<void> {
    const pubClient = new Redis(options);
    const subClient = pubClient.duplicate();

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        pubClient.once('connect', resolve);
        pubClient.once('error', reject);
      }),
      new Promise<void>((resolve, reject) => {
        subClient.once('connect', resolve);
        subClient.once('error', reject);
      }),
    ]);

    this.logger.log('Redis pub/sub clients connected for Socket.IO adapter');
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
