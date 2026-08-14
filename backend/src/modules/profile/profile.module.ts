import { Module } from '@nestjs/common';

import { Employee2Module } from '../employee2/employee2.module';
import { UserModule } from '../user/user.module';
import { FleetModule } from '../fleet/fleet.module';
import { ProfileController } from './presentation/controllers/profile.controller';
import { ProfileQueryService } from './application/services/profile.query.service';

/**
 * Profile module.
 *
 * Answers one question — "who am I?" — for an employee or a driver signing in
 * from the mobile app. It owns no table of its own; it reads through the
 * modules that do and joins the pieces into a single response.
 *
 * It sits on top of employee2, user and fleet rather than inside any of them,
 * which keeps those modules untouched and avoids the import cycle that adding
 * a fleet dependency to employee2 would create.
 *
 * Nothing is exported. This module is a consumer, not a supplier.
 */
@Module({
  imports: [Employee2Module, UserModule, FleetModule],
  controllers: [ProfileController],
  providers: [ProfileQueryService],
})
export class ProfileModule {}
