import { Injectable, ConflictException } from '@nestjs/common';
import { TransactionalPrismaService } from '../../../../packages/transaction';
import { CreateUserDto } from '../../application/dtos/requests/create-user.dto';

@Injectable()
export class UserCommandRepository {
  constructor(private readonly prisma: TransactionalPrismaService) {}

  async create(data: CreateUserDto & { passwordHash: string }): Promise<string> {
    try {
      const user = await this.prisma.client.users.create({
        data: {
          email: data.email,
          phone: data.phone ?? null,
          password_hash: data.passwordHash,
        },
        select: { id: true },
      });
      return user.id;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('User with this email or phone already exists');
      }
      throw error;
    }
  }
}
