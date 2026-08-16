import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { TripQueryService } from './src/modules/fleet/trip/application/services/trip-query.service';
import { SubjectType } from './src/packages/context/principal/principal/SubjectType';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tripQueryService = app.get(TripQueryService);

  console.log('--- Testing filterVisibleTrips ---');

  const allTrips = await tripQueryService.findTrips(undefined, { page: 1, limit: 10 } as any);
  const trip = allTrips.data[0];

  if (!trip) {
    console.log('No trips found to test with.');
    await app.close();
    return;
  }

  const tripId = trip.id;
  // Use raw access just in case the dto mapper changed property names
  const tripTenantId = (trip as any).tenantId || '00000000-0000-7000-8000-000000000001';
  const tripOrigin = (trip as any).originOrgUnitId;

  console.log(`Testing with Trip: ${tripId}, Tenant: ${tripTenantId}, Origin: ${tripOrigin}`);

  // Scenario 1: PLATFORM_OWNER
  const poPrincipal = {
    subject: { type: SubjectType.PLATFORM_OWNER },
  };
  const poResult = await tripQueryService.filterVisibleTrips(poPrincipal, [tripId], tripTenantId);
  console.log(`PLATFORM_OWNER: Expected [${tripId}], Got [${poResult}]`);

  // Scenario 2: TENANT_ADMIN (Correct tenant)
  const taPrincipal = {
    subject: { type: SubjectType.TENANT_ADMIN },
    tenantId: tripTenantId,
  };
  const taResult = await tripQueryService.filterVisibleTrips(taPrincipal, [tripId]);
  console.log(`TENANT_ADMIN (Correct Tenant): Expected [${tripId}], Got [${taResult}]`);

  // Scenario 3: EMPLOYEE (Correct branch)
  const empPrincipal = {
    subject: { type: SubjectType.EMPLOYEE },
    tenantId: tripTenantId,
    branches: [{ id: tripOrigin }],
  };
  const empResult = await tripQueryService.filterVisibleTrips(empPrincipal, [tripId]);
  console.log(`EMPLOYEE (Correct Branch): Expected [${tripId}], Got [${empResult}]`);

  // Scenario 4: EMPLOYEE (Wrong branch)
  const empWrongPrincipal = {
    subject: { type: SubjectType.EMPLOYEE },
    tenantId: tripTenantId,
    branches: [{ id: 'some-other-branch' }],
  };
  const empWrongResult = await tripQueryService.filterVisibleTrips(empWrongPrincipal, [tripId]);
  console.log(`EMPLOYEE (Wrong Branch): Expected [], Got [${empWrongResult}]`);

  await app.close();
}

bootstrap();
