import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AppConfigModule } from './infrastructure/config/app-config.module';

@Module({
  imports: [AppConfigModule, DatabaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
