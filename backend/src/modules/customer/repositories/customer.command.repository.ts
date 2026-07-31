import { Injectable } from '@nestjs/common';
import { TransactionalPrismaService } from '../../../packages/transaction';
import { ICustomerCommandRepository } from '../interfaces/customer.command.repository.interface';

@Injectable()
export class CustomerCommandRepository implements ICustomerCommandRepository {
  constructor(private readonly prisma: TransactionalPrismaService) {}

  async existsByEmailOrPhone(email: string, phone: string): Promise<boolean> {
    const existingUser = await this.prisma.client.users.findFirst({
      where: { OR: [{ email }, { phone }] },
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
}
