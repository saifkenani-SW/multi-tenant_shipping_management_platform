import { Module } from '@nestjs/common';
import { UserFacade } from './application/facades/user.facade';
import { UserQueryService } from './application/services/user.query.service';
import { UserQueryRepository } from './infrastructure/repositories/user.query.repository';
import { DatabaseModule } from '../../infrastructure/database/database.module';

@Module({
  imports: [
    DatabaseModule,
  ],
  providers: [
    UserQueryRepository,
    UserQueryService,
    UserFacade,
  ],
  exports: [
    UserFacade,
  ],
})
export class UserModule {}
