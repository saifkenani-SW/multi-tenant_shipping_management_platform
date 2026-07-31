import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class TransactionFacade {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executes a function inside a Prisma transaction boundary.
   */
  async execute<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
