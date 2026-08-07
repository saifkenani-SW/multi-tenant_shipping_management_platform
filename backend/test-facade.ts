import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { OrganizationFacade } from './src/modules/organization/facades/organization.facade';
import { PrismaClient } from '@prisma/client';

async function bootstrap() {
  const prisma = new PrismaClient();
  
  console.log('Finding valid location mappings in DB...');
  const mappings = await prisma.org_unit_location_mapping.findMany({
    take: 2,
    distinct: ['global_location_id']
  });

  if (mappings.length < 2) {
    console.log('Not enough mappings in DB to test with real data. Using dummy data...');
  }

  const originId = mappings.length > 0 ? mappings[0].global_location_id : '018f6c5b-4a5c-7b4c-9f7a-123456789012';
  const destinationId = mappings.length > 1 ? mappings[1].global_location_id : '018f6c5b-4a5d-7b4c-9f7a-123456789012';

  console.log(`Using Origin: ${originId}`);
  console.log(`Using Destination: ${destinationId}`);

  const app = await NestFactory.createApplicationContext(AppModule);
  const orgFacade = app.get(OrganizationFacade);

  console.log('Calling orgFacade.resolveRoutesForLocations...');
  const result = await orgFacade.resolveRoutesForLocations(originId, destinationId);
  
  console.log('Result:');
  console.log(JSON.stringify(result, null, 2));

  await app.close();
  await prisma.$disconnect();
}

bootstrap().catch(console.error);
