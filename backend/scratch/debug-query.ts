import { NestFactory } from '@nestjs/core';
import { AppModule } from '/home/saif/projects/backend/NestJS/multi-tenant_shipping_management_platform/backend/src/app.module';
import { TenantQueryRepository } from '/home/saif/projects/backend/NestJS/multi-tenant_shipping_management_platform/backend/src/modules/tenant/infrastructure/repositories/tenant.query.repository';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const repo = app.get(TenantQueryRepository);
  const res = await repo.getTenantPricingSettingsBatch(['00000000-0000-7000-8000-000000000101']);
  console.log('Result:', JSON.stringify(Array.from(res.entries()), null, 2));
  await app.close();
}

run().catch(console.error);
