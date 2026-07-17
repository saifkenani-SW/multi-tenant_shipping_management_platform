import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { SubscriptionModule } from '../../subscription.module';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { DatabaseModule } from '../../../../infrastructure/database/database.module';

describe('SubscriptionController (e2e)', () => {
  let app: INestApplication;
  let prisma: any;
  let kysely: any;

  beforeAll(async () => {
    prisma = {
      $transaction: jest.fn((callback) => callback(prisma)),
      subscription_plan: {
        upsert: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      tenant_subscription: {
        upsert: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      tenant_subscription_history: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      tenant: {
        findUnique: jest.fn().mockResolvedValue({ id: 'tenant-123' }),
      },
    };

    kysely = {
      selectFrom: jest.fn().mockReturnThis(),
      selectAll: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue([]),
      executeTakeFirst: jest.fn().mockResolvedValue(null),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SubscriptionModule, DatabaseModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider('KYSELY_INSTANCE')
      .useValue(kysely)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should create a subscription plan (POST /subscription-plans)', async () => {
      prisma.subscription_plan.upsert.mockResolvedValueOnce({});

      const res = await request(app.getHttpServer())
        .post('/subscription-plans')
        .set('x-role', 'PLATFORM_OWNER')
        .send({
          name: 'Pro Plan',
          priceAmount: 100,
          priceCurrency: 'USD',
          billingCycle: 'MONTHLY',
          features: ['All'],
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(prisma.subscription_plan.upsert).toHaveBeenCalled();
    });

    it('should subscribe a tenant to a plan (POST /tenants/:tenantId/subscriptions)', async () => {
      // Mock plan exists
      const planId = '123e4567-e89b-12d3-a456-426614174000';
      const tenantId = '123e4567-e89b-12d3-a456-426614174001';

      prisma.subscription_plan.findUnique.mockResolvedValueOnce({
        id: planId,
        name: 'Pro',
        price_monthly: 100,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const res = await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/subscriptions`)
        .set('x-tenant-id', tenantId)
        .set('x-role', 'PLATFORM_OWNER')
        .send({
          tenantId: tenantId,
          planId: planId,
          startDate: new Date().toISOString(),
          endDate: new Date(
            new Date().setFullYear(new Date().getFullYear() + 1),
          ).toISOString(),
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.tenant_subscription.upsert).toHaveBeenCalled();
    });

    it('should retrieve current subscription (GET /tenants/:tenantId/subscriptions/current)', async () => {
      const mockSub = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        tenant_id: '123e4567-e89b-12d3-a456-426614174001',
        plan_id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'ACTIVE',
        start_date: new Date(),
        end_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      kysely.executeTakeFirst.mockResolvedValueOnce(mockSub);

      const res = await request(app.getHttpServer())
        .get(
          `/tenants/123e4567-e89b-12d3-a456-426614174001/subscriptions/current`,
        )
        .set('x-tenant-id', '123e4567-e89b-12d3-a456-426614174001')
        .expect(200);

      expect(res.body.tenantId).toEqual('123e4567-e89b-12d3-a456-426614174001');
      expect(kysely.executeTakeFirst).toHaveBeenCalled();
    });
  });

  describe('Validation Path', () => {
    it('should reject invalid payload (POST /subscription-plans)', async () => {
      const res = await request(app.getHttpServer())
        .post('/subscription-plans')
        .set('x-role', 'PLATFORM_OWNER')
        .send({
          name: 'Pro',
          priceAmount: -10, // Invalid negative price
          priceCurrency: 'USD',
          billingCycle: 'INVALID_CYCLE', // Invalid enum
        })
        .expect(400);

      expect(res.body.message).toBeInstanceOf(Array);
      expect(res.body.error).toEqual('Bad Request');
      expect(prisma.subscription_plan.upsert).not.toHaveBeenCalled();
    });
  });

  describe('Tenant Isolation Path', () => {
    it('should deny access if x-tenant-id does not match (GET /tenants/:tenantId/subscriptions/current)', async () => {
      const res = await request(app.getHttpServer())
        .get('/tenants/tenant-123/subscriptions/current')
        .set('x-tenant-id', 'wrong-tenant-id')
        .expect(403);

      expect(res.body.message).toEqual(
        'Tenant isolation violation: Unauthorized access',
      );
    });
  });
});
