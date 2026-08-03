import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB } from '../../../../infrastructure/database/generated/kysely/types';

export interface UserSummary {
  id: string;
  email: string;
  phone: string | null;
  isActive: boolean;
}

@Injectable()
export class UserQueryRepository {
  constructor(
    @Inject('KYSELY_INSTANCE')
    private readonly db: Kysely<DB>,
  ) {}

  async exists(userId: string): Promise<boolean> {
    const user = await this.db
      .selectFrom('users')
      .select('id')
      .where('id', '=', userId)
      .executeTakeFirst();
    return !!user;
  }

  async getUserSummary(userId: string): Promise<UserSummary | null> {
    const user = await this.db
      .selectFrom('users')
      .select(['id', 'email', 'phone'])
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      isActive: true, // Assuming isActive is true based on previous logic since users table doesn't have is_active
    };
  }

  async getUserIdentityByEmail(email: string) {
    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('email', 'ilike', email)
      .executeTakeFirst();

    if (!user) return null;

    const [platformAdmin, tenantOwners, employees, customerProfile] =
      await Promise.all([
        this.db
          .selectFrom('platform_admin')
          .selectAll()
          .where('user_id', '=', user.id)
          .executeTakeFirst(),
        this.db
          .selectFrom('tenant_owner')
          .selectAll()
          .where('user_id', '=', user.id)
          .execute(),
        this.db
          .selectFrom('employee')
          .selectAll()
          .where('user_id', '=', user.id)
          .execute(),
        this.db
          .selectFrom('customer_profile')
          .selectAll()
          .where('user_id', '=', user.id)
          .executeTakeFirst(),
      ]);

    let vehicleAssignments: any[] = [];
    if (employees.length > 0) {
      const employeeIds = employees.map((e) => e.id);
      vehicleAssignments = await this.db
        .selectFrom('vehicle_assignment')
        .selectAll()
        .where('employee_id', 'in', employeeIds)
        .where('is_active', '=', true)
        .execute();
    }

    return {
      user,
      platformAdmin,
      tenantOwners,
      employees,
      customerProfile,
      vehicleAssignments,
    };
  }
}
