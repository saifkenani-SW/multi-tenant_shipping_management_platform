import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
  TransactionContext,
  TransactionClient,
} from '../context/transaction.context';

/**
 * Transaction-aware Prisma service.
 *
 * Repositories inject this instead of PrismaService directly.
 * Use `.client` to access the Prisma client:
 *
 * - Inside @Transactional(): returns the active TransactionClient
 * - Outside @Transactional(): returns the regular PrismaService
 *
 * @example
 * constructor(private readonly prisma: TransactionalPrismaService) {}
 *
 * async create(data: CreateData): Promise<string> {
 *   const record = await this.prisma.client.tenant_subscription.create({ data });
 *   return record.id;
 * }
 */
@Injectable()
export class TransactionalPrismaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the active TransactionClient if inside @Transactional(),
   * otherwise returns the regular PrismaService.
   */
  get client(): PrismaService | TransactionClient {
    return TransactionContext.getClient() ?? this.prisma;
  }
}
