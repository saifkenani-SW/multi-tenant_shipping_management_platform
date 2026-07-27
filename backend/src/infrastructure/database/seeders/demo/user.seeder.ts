import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';

const DEMO_USERS = [
  { email: 'admin@fastship.com', phone: '+1987654321' },
  { email: 'admin@quickdelivery.com', phone: '+1122334455' },
  { email: 'admin@swiftlogistics.com', phone: '+1567890123' },
  { email: 'john.doe@email.com', phone: '+1230000001' },
  { email: 'jane.smith@email.com', phone: '+1230000002' },
  { email: 'bob.wilson@email.com', phone: '+1230000003' },
] as const;

@Injectable()
export class UserSeeder implements Seeder {
  private readonly logger = new Logger(UserSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting...');

    const passwordHash = await bcrypt.hash('password123', 10);

    for (const user of DEMO_USERS) {
      await this.prisma.users.upsert({
        where: { email: user.email },
        update: {},
        create: {
          ...user,
          password_hash: passwordHash,
        },
      });
    }

    this.logger.log('Completed.');
    this.logger.log(`Number of processed records: ${DEMO_USERS.length}.`);
  }
}
