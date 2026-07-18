import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerCommandService } from './services/customer.command.service';
import { CustomerQueryService } from './services/customer.query.service';
import { CustomerCommandRepository } from './repositories/customer.command.repository';
import { CustomerQueryRepository } from './repositories/customer.query.repository';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { MailModule } from '../../infrastructure/mail/mail.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CacheModule, DatabaseModule, MailModule, AuthModule],
  controllers: [CustomerController],
  providers: [
    {
      provide: 'ICustomerCommandRepository',
      useClass: CustomerCommandRepository,
    },
    {
      provide: 'ICustomerQueryRepository',
      useClass: CustomerQueryRepository,
    },
    {
      provide: 'ICustomerCommandService',
      useClass: CustomerCommandService,
    },
    {
      provide: 'ICustomerQueryService',
      useClass: CustomerQueryService,
    },
  ],
  exports: ['ICustomerCommandService', 'ICustomerQueryService'],
})
export class CustomerModule {}
