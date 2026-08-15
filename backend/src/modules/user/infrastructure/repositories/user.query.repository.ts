import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB } from '../../../../infrastructure/database/generated/kysely/types';

export interface UserSummary {
  id: string;
  email: string;
  phone: string | null;
  profileImageKey: string | null;
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
      .select(['id', 'email', 'phone', 'profile_image_key'])
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      profileImageKey: user.profile_image_key,
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

    const [platformOwner, tenantOwners, employees, customerProfile] =
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

    // Names for every workspace this user belongs to, in one round trip. The
    // login response carries a workspace id, and an id alone is not something
    // a person can choose between when they hold more than one.
    const tenantIds = [
      ...new Set([
        ...tenantOwners.map((owner) => owner.tenant_id),
        ...employees.map((employee) => employee.tenant_id),
      ]),
    ];

    const tenants = tenantIds.length
      ? await this.db
          .selectFrom('tenant')
          .select(['id', 'name'])
          .where('id', 'in', tenantIds)
          .execute()
      : [];

    return {
      user,
      platformOwner,
      tenantOwners,
      employees,
      customerProfile,
      vehicleAssignments,
      tenantNames: new Map(tenants.map((tenant) => [tenant.id, tenant.name])),
    };
  }
}
