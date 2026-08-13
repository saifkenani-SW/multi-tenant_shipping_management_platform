import { Module } from '@nestjs/common';
import { UserFacade } from './application/facades/user.facade';
import { UserQueryService } from './application/services/user.query.service';
import { UserCommandService } from './application/services/user.command.service';
import { UserQueryRepository } from './infrastructure/repositories/user.query.repository';
import { UserCommandRepository } from './infrastructure/repositories/user.command.repository';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { UserController } from './presentation/controllers/user.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [
    UserQueryRepository,
    UserCommandRepository,
    UserQueryService,
    UserCommandService,
    UserFacade
  ],
  exports: [UserFacade],
})
export class UserModule {}
