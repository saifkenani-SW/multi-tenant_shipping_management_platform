import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { StatisticsController } from './presentation/controllers/statistics.controller';
import { FinancialStatisticsService } from './application/services/financial-statistics.service';
import { FinancialStatisticsQueryRepository } from './infrastructure/repositories/financial-statistics.query.repository';

/**
 * Statistics module.
 *
 * Read only, and deliberately thin: it owns no table and changes nothing. It
 * reads the billing tables directly rather than through BillingFacade because
 * a facade returns whole records, and an aggregate over a few thousand rows
 * must never be assembled in application code.
 *
 * Nothing is exported. This module is a consumer, not a supplier.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [StatisticsController],
  providers: [FinancialStatisticsService, FinancialStatisticsQueryRepository],
})
export class StatisticsModule {}
