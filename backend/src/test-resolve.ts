import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { OrganizationFacade } from './modules/organization/facades/organization.facade';
import { Kysely } from 'kysely';
import { DB } from './infrastructure/database/generated/kysely/types';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const facade = app.get(OrganizationFacade);
  const kysely = app.get('KYSELY_INSTANCE') as Kysely<DB>;

  const mappings = await kysely
    .selectFrom('org_unit_location_mapping')
    .select('global_location_id')
    .limit(1)
    .execute();

  if (mappings.length === 0) {
    console.log('No location mappings found in DB. Test will return empty.');
    const result = await facade.resolveRoutesForLocations('dummy1', 'dummy2');
    console.log(JSON.stringify(result, null, 2));
    await app.close();
    return;
  }

  const testLocation = mappings[0].global_location_id;

  console.log(`\n--- Test Started ---`);
  console.log(`Origin Location ID: ${testLocation}`);
  console.log(`Destination Location ID: ${testLocation}`);
  console.log(
    `(Using the same location to guarantee a tenant overlap for testing)\n`,
  );

  console.time('Execution Time');
  const result = await facade.resolveRoutesForLocations(
    testLocation,
    testLocation,
  );
  console.timeEnd('Execution Time');

  console.log('\n--- Output ---');
  console.log(JSON.stringify(result, null, 2));
  console.log('--------------\n');

  await app.close();
}

bootstrap().catch(console.error);
