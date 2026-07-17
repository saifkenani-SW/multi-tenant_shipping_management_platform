import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seed.module';
import { PermissionSeeder } from './permission.seeder';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Seeder');
  try {
    const appContext = await NestFactory.createApplicationContext(SeederModule);
    const permissionSeeder = appContext.get(PermissionSeeder);

    await permissionSeeder.seed();

    await appContext.close();
    logger.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed', error);
    process.exit(1);
  }
}

bootstrap();
