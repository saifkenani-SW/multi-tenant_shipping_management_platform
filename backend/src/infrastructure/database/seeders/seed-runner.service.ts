import { Injectable, Logger } from '@nestjs/common';
import { RoleSeeder } from './demo/role.seeder';
import { TenantSeeder } from './demo/tenant.seeder';
import { UserSeeder } from './demo/user.seeder';
import { Seeder } from './seeder.interface';
import { PermissionSeeder } from './system/permission.seeder';
import { PlatformOwnerSeeder } from './system/platform-owner.seeder';
import { SubscriptionPlanSeeder } from './system/subscription-plan.seeder';

@Injectable()
export class SeedRunner {
  private readonly logger = new Logger(SeedRunner.name);

  constructor(
    private readonly permissionSeeder: PermissionSeeder,
    private readonly subscriptionPlanSeeder: SubscriptionPlanSeeder,
    private readonly platformOwnerSeeder: PlatformOwnerSeeder,
    private readonly tenantSeeder: TenantSeeder,
    private readonly roleSeeder: RoleSeeder,
    private readonly userSeeder: UserSeeder,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Starting system seeders...');
    await this.runSeeders([
      this.permissionSeeder,
      this.subscriptionPlanSeeder,
      this.platformOwnerSeeder,
    ]);

    if (process.env.NODE_ENV !== 'production') {
      this.logger.log('Starting demo seeders...');
      await this.runSeeders([
        this.tenantSeeder,
        this.roleSeeder,
        this.userSeeder,
      ]);
    }

    this.logger.log('Seeding completed successfully.');
  }

  private async runSeeders(seeders: Seeder[]): Promise<void> {
    for (const seeder of seeders) {
      try {
        await seeder.seed();
      } catch (error) {
        this.logger.error(
          `Seeder ${seeder.constructor.name} failed.`,
          error instanceof Error ? error.stack : String(error),
        );
        throw error;
      }
    }
  }
}
