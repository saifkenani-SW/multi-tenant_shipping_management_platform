import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database.module';
import { PermissionSeeder } from './permission.seeder';

@Module({
  imports: [DatabaseModule],
  providers: [PermissionSeeder],
})
export class SeederModule {}
