import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: 'KYSELY_INSTANCE',
      useValue: {}, // Mocked Kysely instance for now
    },
  ],
  exports: [PrismaService, 'KYSELY_INSTANCE'],
})
export class DatabaseModule {}
