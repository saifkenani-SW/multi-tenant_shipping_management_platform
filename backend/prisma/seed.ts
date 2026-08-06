// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// تحميل متغيرات البيئة
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

// إنشاء PrismaClient مع Driver Adapter (مثل PrismaService)
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});

async function main() {
  console.log('🌱 Starting seed...');
  console.log('📦 Connected to database');

  // =========================================================================
  // 1. SUBSCRIPTION PLANS
  // =========================================================================
  const plans = await Promise.all([
    prisma.subscription_plan.create({
      data: {
        name: 'Starter',
        description: 'Perfect for small businesses',
        max_branches: 3,
        max_warehouses: 1,
        max_employees: 10,
        max_vehicles: 5,
        max_zones: 2,
        max_monthly_shipments: 500,
        max_monthly_parcels: 1000,
        price_monthly: 49.99,
        price_yearly: 499.99,
      },
    }),
    prisma.subscription_plan.create({
      data: {
        name: 'Business',
        description: 'For growing logistics companies',
        max_branches: 10,
        max_warehouses: 5,
        max_employees: 50,
        max_vehicles: 25,
        max_zones: 5,
        max_monthly_shipments: 2000,
        max_monthly_parcels: 5000,
        price_monthly: 149.99,
        price_yearly: 1499.99,
      },
    }),
    prisma.subscription_plan.create({
      data: {
        name: 'Enterprise',
        description: 'Unlimited scale for large operations',
        max_branches: 50,
        max_warehouses: 20,
        max_employees: 200,
        max_vehicles: 100,
        max_zones: 10,
        max_monthly_shipments: null,
        max_monthly_parcels: null,
        price_monthly: 499.99,
        price_yearly: 4999.99,
      },
    }),
  ]);

  console.log('✅ Subscription plans created');

  // =========================================================================
  // 2. USERS
  // =========================================================================
  const passwordHash = await bcrypt.hash('password123', 10);

  const platformOwnerUser = await prisma.users.create({
    data: {
      email: 'owner@logisticsplatform.com',
      phone: '+1234567890',
      password_hash: passwordHash,
    },
  });

  const tenantAdmin1User = await prisma.users.create({
    data: {
      email: 'admin@fastship.com',
      phone: '+1987654321',
      password_hash: passwordHash,
    },
  });

  const tenantAdmin2User = await prisma.users.create({
    data: {
      email: 'admin@quickdelivery.com',
      phone: '+1122334455',
      password_hash: passwordHash,
    },
  });

  const tenantAdmin3User = await prisma.users.create({
    data: {
      email: 'admin@swiftlogistics.com',
      phone: '+1567890123',
      password_hash: passwordHash,
    },
  });

  const customer1User = await prisma.users.create({
    data: {
      email: 'john.doe@email.com',
      phone: '+1230000001',
      password_hash: passwordHash,
    },
  });

  const customer2User = await prisma.users.create({
    data: {
      email: 'jane.smith@email.com',
      phone: '+1230000002',
      password_hash: passwordHash,
    },
  });

  const customer3User = await prisma.users.create({
    data: {
      email: 'bob.wilson@email.com',
      phone: '+1230000003',
      password_hash: passwordHash,
    },
  });

  const employeeUser = await prisma.users.create({
    data: {
      email: 'employee@fastship.com',
      phone: '+1234567000',
      password_hash: passwordHash,
    },
  });

  const driverUser = await prisma.users.create({
    data: {
      email: 'driver@fastship.com',
      phone: '+1234567001',
      password_hash: passwordHash,
    },
  });

  console.log('✅ Users created');

  // =========================================================================
  // 3. PLATFORM ADMIN
  // =========================================================================
  await prisma.platform_admin.create({
    data: {
      user_id: platformOwnerUser.id,
      full_name: 'Ahmed Al-Rashid',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('✅ Platform admin created');

  // =========================================================================
  // 4. TENANTS
  // =========================================================================
  const tenant1 = await prisma.tenant.create({
    data: {
      name: 'FastShip Logistics',
      email: 'info@fastship.com',
      phone: '+1987654321',
      tax_number: 'TAX-001-2024',
      logo_url: 'https://cdn.fastship.com/logo.png',
    },
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'QuickDelivery Co.',
      email: 'info@quickdelivery.com',
      phone: '+1122334455',
      tax_number: 'TAX-002-2024',
    },
  });

  const tenant3 = await prisma.tenant.create({
    data: {
      name: 'Swift Logistics',
      email: 'contact@swiftlogistics.com',
      phone: '+1567890123',
      tax_number: 'TAX-003-2024',
    },
  });

  console.log('✅ Tenants created');

  // =========================================================================
  // 5. TENANT SUBSCRIPTIONS
  // =========================================================================
  const subscriptions = await Promise.all([
    prisma.tenant_subscription.create({
      data: {
        tenant_id: tenant1.id,
        plan_id: plans[2].id,
        status: 'ACTIVE',
        started_at: new Date('2024-01-01'),
        expires_at: new Date('2025-01-01'),
        snapshot_max_branches: plans[2].max_branches,
        snapshot_max_warehouses: plans[2].max_warehouses,
        snapshot_max_employees: plans[2].max_employees,
        snapshot_max_vehicles: plans[2].max_vehicles,
        snapshot_max_zones: plans[2].max_zones,
        snapshot_max_monthly_shipments: plans[2].max_monthly_shipments,
        snapshot_max_monthly_parcels: plans[2].max_monthly_parcels,
        snapshot_features: {
          ai_routing: true,
          advanced_analytics: true,
          white_label: true,
        },
      },
    }),
    prisma.tenant_subscription.create({
      data: {
        tenant_id: tenant2.id,
        plan_id: plans[1].id,
        status: 'ACTIVE',
        started_at: new Date('2024-03-15'),
        expires_at: new Date('2025-03-15'),
        snapshot_max_branches: plans[1].max_branches,
        snapshot_max_warehouses: plans[1].max_warehouses,
        snapshot_max_employees: plans[1].max_employees,
        snapshot_max_vehicles: plans[1].max_vehicles,
        snapshot_max_zones: plans[1].max_zones,
        snapshot_max_monthly_shipments: plans[1].max_monthly_shipments,
        snapshot_max_monthly_parcels: plans[1].max_monthly_parcels,
        snapshot_features: { ai_routing: true, advanced_analytics: false },
      },
    }),
    prisma.tenant_subscription.create({
      data: {
        tenant_id: tenant3.id,
        plan_id: plans[0].id,
        status: 'TRIAL',
        started_at: new Date('2024-06-01'),
        expires_at: new Date('2024-07-01'),
        snapshot_max_branches: plans[0].max_branches,
        snapshot_max_warehouses: plans[0].max_warehouses,
        snapshot_max_employees: plans[0].max_employees,
        snapshot_max_vehicles: plans[0].max_vehicles,
        snapshot_max_zones: plans[0].max_zones,
        snapshot_max_monthly_shipments: plans[0].max_monthly_shipments,
        snapshot_max_monthly_parcels: plans[0].max_monthly_parcels,
        snapshot_features: {},
      },
    }),
  ]);

  console.log('✅ Subscriptions created');

  // =========================================================================
  // 6. SUPER ALL-IN-ONE USER (For Testing Multi-Profile)
  // =========================================================================
  const superUser = await prisma.users.create({
    data: {
      email: 'super@all-in-one.com',
      phone: '+9999999999',
      password_hash: passwordHash,
    },
  });

  // 6.1. Platform Admin
  await prisma.platform_admin.create({
    data: {
      user_id: superUser.id,
      full_name: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  });

  // 6.2. Tenant Owner
  await prisma.tenant_owner.create({
    data: {
      user_id: superUser.id,
      tenant_id: tenant1.id,
    },
  });

  await prisma.tenant_owner.create({
    data: {
      user_id: tenantAdmin1User.id,
      tenant_id: tenant1.id,
    },
  });

  await prisma.tenant_owner.create({
    data: {
      user_id: tenantAdmin2User.id,
      tenant_id: tenant2.id,
    },
  });

  await prisma.tenant_owner.create({
    data: {
      user_id: tenantAdmin3User.id,
      tenant_id: tenant3.id,
    },
  });

  // 6.3. Employee
  const superEmployee = await prisma.employee.create({
    data: {
      user_id: superUser.id,
      tenant_id: tenant1.id,
      employee_code: 'EMP-SUPER',
      full_name: 'Super Employee',
    },
  });

  // Create a branch for the employee2 assignment
  const hqLocation = await prisma.global_location.create({
    data: {
      name: 'Riyadh HQ Location',
      type: 'CITY',
    },
  });

  const branch = await prisma.organization_unit.create({
    data: {
      tenant_id: tenant1.id,
      name: 'Riyadh Main Branch',
      org_type: 'BRANCH',
    },
  });

  // Create a role for the employee2
  const managerRole = await prisma.role.create({
    data: {
      tenant_id: tenant1.id,
      name: 'Branch Manager',
      description: 'Manages the branch',
    },
  });

  // Assign employee2 to branch
  const empAssignment = await prisma.employee_assignment.create({
    data: {
      tenant_id: tenant1.id,
      employee_id: superEmployee.id,
      organization_unit_id: branch.id,
    },
  });

  // Link role to assignment
  await prisma.assignment_role.create({
    data: {
      assignment_id: empAssignment.id,
      role_id: managerRole.id,
    },
  });

  // 6.4. Vehicle & Driver Assignment
  const vehicle = await prisma.vehicle.create({
    data: {
      tenant_id: tenant1.id,
      plate_number: 'ABC-1234',
      type: 'Van',
      capacity_kg: 1000,
    },
  });

  await prisma.vehicle_assignment.create({
    data: {
      tenant_id: tenant1.id,
      employee_id: superEmployee.id,
      vehicle_id: vehicle.id,
      is_active: true,
    },
  });

  // 6.5. Customer Profile
  await prisma.customer_profile.create({
    data: {
      user_id: superUser.id,
      full_name: 'Super Customer',
      phone: '+9999999999',
    },
  });

  await prisma.customer_profile.createMany({
    data: [
      {
        user_id: customer1User.id,
        full_name: 'John Doe',
        phone: '+1230000001',
      },
      {
        user_id: customer2User.id,
        full_name: 'Jane Smith',
        phone: '+1230000002',
      },
      {
        user_id: customer3User.id,
        full_name: 'Bob Wilson',
        phone: '+1230000003',
      },
    ],
  });

  console.log('✅ Super All-In-One User created');

  // =========================================================================
  // 7. Regular Employee and Driver
  // =========================================================================
  const regEmployee = await prisma.employee.create({
    data: {
      user_id: employeeUser.id,
      tenant_id: tenant1.id,
      employee_code: 'EMP-001',
      full_name: 'Regular Employee',
    },
  });

  const regEmpAssignment = await prisma.employee_assignment.create({
    data: {
      tenant_id: tenant1.id,
      employee_id: regEmployee.id,
      organization_unit_id: branch.id,
    },
  });

  await prisma.assignment_role.create({
    data: {
      assignment_id: regEmpAssignment.id,
      role_id: managerRole.id,
    },
  });

  const regDriver = await prisma.employee.create({
    data: {
      user_id: driverUser.id,
      tenant_id: tenant1.id,
      employee_code: 'DRV-001',
      full_name: 'Regular Driver',
    },
  });

  const regDrvAssignment = await prisma.employee_assignment.create({
    data: {
      tenant_id: tenant1.id,
      employee_id: regDriver.id,
      organization_unit_id: branch.id,
    },
  });

  await prisma.assignment_role.create({
    data: {
      assignment_id: regDrvAssignment.id,
      role_id: managerRole.id,
    },
  });

  await prisma.vehicle_assignment.create({
    data: {
      tenant_id: tenant1.id,
      employee_id: regDriver.id,
      vehicle_id: vehicle.id,
      is_active: true,
    },
  });

  console.log('✅ Regular Employee and Driver created');
  // ... يمكنك إكمال باقي الكود من الرد السابق ...

  console.log('✅ Seed completed successfully!');
  console.log('\n📧 Login Credentials (password: password123):');
  console.log('👑 Platform Owner: owner@logisticsplatform.com');
  console.log('🏢 Tenant Admin 1: admin@fastship.com');
  console.log('🏢 Tenant Admin 2: admin@quickdelivery.com');
  console.log('🏢 Tenant Admin 3: admin@swiftlogistics.com');
  console.log('👤 Customer 1: john.doe@email.com');
  console.log('👤 Customer 2: jane.smith@email.com');
  console.log('👤 Customer 3: bob.wilson@email.com');
  console.log('🌟 Super All-In-One: super@all-in-one.com');
  console.log('👔 Employee: employee@fastship.com');
  console.log('🚚 Driver: driver@fastship.com');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
