import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { DatabaseModule } from '../database.module';
import { RoleSeeder } from './demo/role.seeder';
import { TenantSeeder } from './demo/tenant.seeder';
import { UserSeeder } from './demo/user.seeder';
import { SeedRunner } from './seed-runner.service';
import { PermissionSeeder } from './system/permission.seeder';
import { PlatformOwnerSeeder } from './system/platform-owner.seeder';
import { SubscriptionPlanSeeder } from './system/subscription-plan.seeder';

@Module({
  imports: [AppConfigModule, DatabaseModule],
  providers: [
    SeedRunner,
    PermissionSeeder,
    SubscriptionPlanSeeder,
    PlatformOwnerSeeder,
    TenantSeeder,
    RoleSeeder,
    UserSeeder,
  ],
})
export class SeederModule {}
