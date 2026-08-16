import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';

export const SEEDED_USERS = [
  {
    id: '00000000-0000-7000-8000-000000000010',
    email: 'owner@logisticsplatform.com',
    phone: '+963944000001',
  },
  {
    id: '00000000-0000-7000-8000-000000000011',
    email: 'admin@fastship.com',
    phone: '+963944111001',
  },
  {
    id: '00000000-0000-7000-8000-000000000012',
    email: 'admin@quickdelivery.com',
    phone: '+963944222001',
  },
  {
    id: '00000000-0000-7000-8000-000000000017',
    email: 'admin@globalfreight.com',
    phone: '+963944333001',
  },
  {
    id: '00000000-0000-7000-8000-000000000013',
    email: 'driver@fastship.com',
    phone: '+963933111002',
  },
  {
    id: '00000000-0000-7000-8000-000000000016',
    email: 'employee@fastship.com',
    phone: '+963933111003',
  },
  {
    id: '00000000-0000-7000-8000-000000000018',
    email: 'driver@quickdelivery.com',
    phone: '+963933222002',
  },
  {
    id: '00000000-0000-7000-8000-000000000019',
    email: 'employee@quickdelivery.com',
    phone: '+963933222003',
  },
  {
    id: '00000000-0000-7000-8000-000000000021',
    email: 'driver@globalfreight.com',
    phone: '+963933333002',
  },
  {
    id: '00000000-0000-7000-8000-000000000014',
    email: 'john.doe@email.com',
    phone: '+963933111004',
  },
  {
    id: '00000000-0000-7000-8000-000000000015',
    email: 'jane.smith@email.com',
    phone: '+963944222004',
  },
  {
    id: '00000000-0000-7000-8000-000000000022',
    email: 'omar.najjar@email.sy',
    phone: '+963955333004',
  },
  {
    id: '00000000-0000-7000-8000-000000000023',
    email: 'hiba.atri@email.sy',
    phone: '+963966444004',
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
        where: { id: u.id },
        update: {
          email: u.email,
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

    const ownerUser = await this.prisma.users.findUnique({
      where: { email: 'owner@logisticsplatform.com' },
    });

    if (ownerUser) {
      await this.prisma.platform_admin.upsert({
        where: { user_id: ownerUser.id },
        update: {
          full_name: 'عبد الرحمن الخطيب',
          role: 'SUPER_ADMIN',
          is_active: true,
        },
        create: {
          id: '00000000-0000-7000-8000-000000000020',
          user_id: ownerUser.id,
          full_name: 'عبد الرحمن الخطيب',
          role: 'SUPER_ADMIN',
          is_active: true,
        },
      });

      await this.prisma.user_session.upsert({
        where: { id: '00000000-0000-7000-8000-000000000030' },
        update: {
          hashed_refresh_token: 'seeded_hashed_refresh_token',
          device_info: 'Chrome on Windows — دمشق',
          ip_address: '127.0.0.1',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        create: {
          id: '00000000-0000-7000-8000-000000000030',
          user_id: ownerUser.id,
          hashed_refresh_token: 'seeded_hashed_refresh_token',
          device_info: 'Chrome on Windows — دمشق',
          ip_address: '127.0.0.1',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    this.logger.log('UserSeeder completed.');
  }
}
