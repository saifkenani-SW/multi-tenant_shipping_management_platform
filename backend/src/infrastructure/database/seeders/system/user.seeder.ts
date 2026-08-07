import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';

export const SEEDED_USERS = [
  {
    id: '00000000-0000-7000-8000-000000000010',
    email: 'owner@logisticsplatform.com',
    phone: '+1234567890',
  },
  {
    id: '00000000-0000-7000-8000-000000000011',
    email: 'admin@fastship.com',
    phone: '+1987654321',
  },
  {
    id: '00000000-0000-7000-8000-000000000012',
    email: 'admin@quickdelivery.com',
    phone: '+1122334455',
  },
  {
    id: '00000000-0000-7000-8000-000000000013',
    email: 'driver@fastship.com',
    phone: '+1555666777',
  },
  {
    id: '00000000-0000-7000-8000-000000000016',
    email: 'employee@fastship.com',
    phone: '+1555666888',
  },
  {
    id: '00000000-0000-7000-8000-000000000014',
    email: 'john.doe@email.com',
    phone: '+1230000001',
  },
  {
    id: '00000000-0000-7000-8000-000000000015',
    email: 'jane.smith@email.com',
    phone: '+1230000002',
  },
] as const;

@Injectable()
export class UserSeeder implements Seeder {
  private readonly logger = new Logger(UserSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting UserSeeder...');

    const passwordHash = await bcrypt.hash('password123', 10);

    for (const u of SEEDED_USERS) {
      await this.prisma.users.upsert({
        where: { email: u.email },
        update: {
          phone: u.phone,
          password_hash: passwordHash,
        },
        create: {
          id: u.id,
          email: u.email,
          phone: u.phone,
          password_hash: passwordHash,
        },
      });
    }

    // Platform Admin
    const ownerUser = await this.prisma.users.findUnique({
      where: { email: 'owner@logisticsplatform.com' },
    });

    if (ownerUser) {
      await this.prisma.platform_admin.upsert({
        where: { user_id: ownerUser.id },
        update: {
          full_name: 'Ahmed Al-Rashid',
          role: 'SUPER_ADMIN',
          is_active: true,
        },
        create: {
          id: '00000000-0000-7000-8000-000000000020',
          user_id: ownerUser.id,
          full_name: 'Ahmed Al-Rashid',
          role: 'SUPER_ADMIN',
          is_active: true,
        },
      });

      // User Session
      await this.prisma.user_session.upsert({
        where: { id: '00000000-0000-7000-8000-000000000030' },
        update: {
          hashed_refresh_token: 'seeded_hashed_refresh_token',
          device_info: 'Chrome on Linux',
          ip_address: '127.0.0.1',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        create: {
          id: '00000000-0000-7000-8000-000000000030',
          user_id: ownerUser.id,
          hashed_refresh_token: 'seeded_hashed_refresh_token',
          device_info: 'Chrome on Linux',
          ip_address: '127.0.0.1',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    this.logger.log('UserSeeder completed.');
  }
}
