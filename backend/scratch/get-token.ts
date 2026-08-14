import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const kysely = app.get('KYSELY_INSTANCE');
  
  const employee = await kysely.selectFrom('employee').selectAll().executeTakeFirst();
  if (!employee) {
    console.log('No employee found');
    await app.close();
    return;
  }
  
  const user = await kysely.selectFrom('users').selectAll().where('id', '=', employee.user_id).executeTakeFirst();
  
  const jwtService = app.get(JwtService);
  const token = jwtService.sign({
    sub: user.id,
    email: user.email,
    userType: 'EMPLOYEE',
    tenantId: user.tenant_id,
    profileId: employee.id
  });
  
  console.log('TOKEN=' + token);
  
  const parcel = await kysely.selectFrom('parcel').selectAll().where('tenant_id', '=', user.tenant_id).executeTakeFirst();
  if (parcel) {
    console.log('TRACKING_NUMBER=' + parcel.tracking_number);
  } else {
    console.log('No parcel found.');
  }

  await app.close();
}

bootstrap();
