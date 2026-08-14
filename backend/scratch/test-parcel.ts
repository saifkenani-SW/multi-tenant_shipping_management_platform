import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ParcelCommandService } from '../src/modules/customer-shipment/parcel/application/services/parcel.command.service';
import { ParcelQueryService } from '../src/modules/customer-shipment/parcel/application/services/parcel.query.service';
import { AsyncContextProvider } from '../src/packages/context/providers/async-context.provider';
import { ActionType, ParcelCondition, ParcelStatus } from '@prisma/client';

async function bootstrap() {
  console.log('Bootstrapping app...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const commandService = app.get(ParcelCommandService);
  const queryService = app.get(ParcelQueryService);
  const contextProvider = app.get(AsyncContextProvider);

  const kysely = app.get('KYSELY_INSTANCE');
  const existingParcel = await kysely.selectFrom('parcel').select(['tracking_number', 'tenant_id']).executeTakeFirst();
  
  if (!existingParcel) {
    console.log('No parcel found in DB, skipping test.');
    await app.close();
    return;
  }
  
  console.log('Found parcel:', existingParcel.tracking_number);

  const principal = {
    id: 'test-user',
    tenantId: existingParcel.tenant_id,
    type: 'EMPLOYEE',
    profileId: 'test-employee',
  };

  const context = {
    requestId: 'req-1',
    correlationId: 'cor-1',
    principal: principal as any,
  };

  await new Promise<void>((resolve) => {
    contextProvider.run(context, async () => {
      try {
        console.log('Testing findByTrackingNumber...');
        const parcel = await queryService.findByTrackingNumber(existingParcel.tracking_number);
        console.log('Parcel found:', parcel.trackingNumber);

        console.log('\nTesting receiveParcel...');
        try {
          await commandService.receiveParcel(existingParcel.tracking_number);
          console.log('Successfully received parcel!');
        } catch (err: any) {
          console.log('receiveParcel error:', err.message);
        }

        console.log('\nTesting markReadyForDispatch...');
        try {
          await commandService.markReadyForDispatch(existingParcel.tracking_number);
          console.log('Successfully dispatched parcel!');
        } catch (err: any) {
          console.log('markReadyForDispatch error:', err.message);
        }
        
      } catch (e) {
        console.error('Test error:', e);
      } finally {
        resolve();
      }
    });
  });

  await app.close();
}

bootstrap();
