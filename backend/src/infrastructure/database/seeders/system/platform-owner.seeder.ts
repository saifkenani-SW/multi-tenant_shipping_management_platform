import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';

const PLATFORM_OWNER_EMAIL = 'owner@logisticsplatform.com';
const PLATFORM_OWNER_PASSWORD = 'password123';

@Injectable()
export class PlatformOwnerSeeder implements Seeder {
  private readonly logger = new Logger(PlatformOwnerSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting...');

    const passwordHash = await bcrypt.hash(PLATFORM_OWNER_PASSWORD, 10);
    const owner = await this.prisma.users.upsert({
      where: { email: PLATFORM_OWNER_EMAIL },
      update: {},
      create: {
        email: PLATFORM_OWNER_EMAIL,
        phone: '+963944000001',
        password_hash: passwordHash,
      },
    });

    await this.prisma.platform_admin.upsert({
      where: { user_id: owner.id },
      update: {
        full_name: 'عبد الرحمن الخطيب',
      },
      create: {
        user_id: owner.id,
        full_name: 'عبد الرحمن الخطيب',
        role: 'SUPER_ADMIN',
      },
    });

    this.logger.log('Completed.');
    this.logger.log('Number of processed records: 1.');
  }
}
