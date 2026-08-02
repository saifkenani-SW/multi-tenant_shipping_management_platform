import { Injectable } from '@nestjs/common';
import { TransactionalPrismaService } from '../../../packages/transaction';
import { ICustomerCommandRepository } from '../interfaces/customer.command.repository.interface';

@Injectable()
export class CustomerCommandRepository implements ICustomerCommandRepository {
  constructor(private readonly prisma: TransactionalPrismaService) {}

  async existsByEmailOrPhone(email: string, phone: string): Promise<boolean> {
    const existingUser = await this.prisma.client.users.findFirst({
      where: {
        OR: [{ email: { equals: email, mode: 'insensitive' } }, { phone }],
      },
    });
    return !!existingUser;
  }

  async createUser(data: {
    email: string;
    phone: string;
    passwordHash: string;
  }): Promise<{ id: string; email: string }> {
    const user = await this.prisma.client.users.create({
      data: {
        email: data.email,
        phone: data.phone,
        password_hash: data.passwordHash,
      },
    });
    return { id: user.id, email: user.email };
  }

  async createProfile(data: {
    userId: string;
    fullName: string;
    phone: string;
  }): Promise<void> {
    await this.prisma.client.customer_profile.create({
      data: {
        user_id: data.userId,
        full_name: data.fullName,
        phone: data.phone,
      },
    });
  }

  async findProfileImageByUserId(userId: string): Promise<{
    profileId: string;
    storageKey: string | null;
  } | null> {
    const profile = await this.prisma.client.customer_profile.findUnique({
      where: { user_id: userId },
      select: { id: true, profile_image_key: true },
    });

    if (!profile) return null;

    return {
      profileId: profile.id,
      storageKey: profile.profile_image_key,
    };
  }

  async updateProfileImageKey(
    userId: string,
    storageKey: string,
  ): Promise<{ profileId: string; updatedAt: Date }> {
    const profile = await this.prisma.client.customer_profile.update({
      where: { user_id: userId },
      data: { profile_image_key: storageKey },
      select: { id: true, updated_at: true },
    });

    return { profileId: profile.id, updatedAt: profile.updated_at };
  }

  async findCustomerCredentialsByEmail(email: string): Promise<{
    userId: string;
    passwordHash: string;
  } | null> {
    const user = await this.prisma.client.users.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        customer_profile: { isNot: null },
      },
      select: { id: true, password_hash: true },
    });

    if (!user) return null;

    return { userId: user.id, passwordHash: user.password_hash };
  }

  async findCustomerCredentialsByUserId(userId: string): Promise<{
    userId: string;
    passwordHash: string;
  } | null> {
    const user = await this.prisma.client.users.findFirst({
      where: {
        id: userId,
        customer_profile: { isNot: null },
      },
      select: { id: true, password_hash: true },
    });

    if (!user) return null;

    return { userId: user.id, passwordHash: user.password_hash };
  }

  async updatePasswordAndRevokeSessions(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    await this.prisma.client.users.update({
      where: { id: userId },
      data: {
        password_hash: passwordHash,
        userSessions: { deleteMany: {} },
      },
    });
  }
}
