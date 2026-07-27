import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SeedRunner } from './seed-runner.service';
import { SeederModule } from './seed.module';

async function bootstrap() {
  const logger = new Logger('Seeder');
  let app:
    | Awaited<ReturnType<typeof NestFactory.createApplicationContext>>
    | undefined;

  try {
    app = await NestFactory.createApplicationContext(SeederModule);
    const runner = app.get(SeedRunner);

    await runner.run();
  } catch (error) {
    logger.error('Seeding failed', error);
    process.exitCode = 1;
  } finally {
    await app?.close();
  }
}

bootstrap();
