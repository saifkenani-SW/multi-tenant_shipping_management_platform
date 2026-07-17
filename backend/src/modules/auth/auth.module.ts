import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GlobalAuthGuard } from './guards/global-auth.guard';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import { PermissionCacheService } from './authorization/services/permission-cache.service';
import { UserTypeGuard } from './authorization/guards/user-type.guard';
import { PermissionsGuard } from './authorization/guards/permissions.guard';

@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    PassportModule,
    JwtModule.register({}),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 5,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: GlobalAuthGuard,
    },
    PermissionCacheService,
    UserTypeGuard,
    PermissionsGuard,
  ],
  exports: [UserTypeGuard, PermissionsGuard],
})
export class AuthModule {}
