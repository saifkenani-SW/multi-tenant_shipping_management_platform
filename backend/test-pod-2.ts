import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ParcelCommandService } from './src/modules/customer-shipment/parcel/application/services/parcel.command.service';
import { AsyncContextProvider } from './src/packages/context/providers/async-context.provider';
import { Principal } from './src/packages/context/principal/principal/Principal';
import { ParcelStatus } from '@prisma/client';

async function bootstrap() {
  console.log('Bootstrapping app...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const commandService = app.get(ParcelCommandService);
  const contextProvider = app.get(AsyncContextProvider);

  const kysely = app.get('KYSELY_INSTANCE');
  let parcel = await kysely.selectFrom('parcel').select(['tracking_number', 'tenant_id', 'id', 'current_org_unit_id']).where('current_status', '=', ParcelStatus.READY_FOR_COLLECTION).executeTakeFirst();
  
  if (!parcel) {
    console.log('No parcel found in READY_FOR_COLLECTION, finding any parcel and forcing it to READY_FOR_COLLECTION...');
    parcel = await kysely.selectFrom('parcel').select(['tracking_number', 'tenant_id', 'id', 'current_org_unit_id']).executeTakeFirst();
    if (!parcel) {
      console.log('No parcels in DB!');
      await app.close();
      return;
    }
    await kysely.updateTable('parcel').set({ current_status: ParcelStatus.READY_FOR_COLLECTION }).where('id', '=', parcel.id).execute();
    console.log('Forced parcel', parcel.tracking_number, 'to READY_FOR_COLLECTION');
  } else {
    console.log('Found parcel in READY_FOR_COLLECTION:', parcel.tracking_number);
  }

  const principal: Principal = {
    subject: { id: 'test-user', type: 'EMPLOYEE' as any },
    tenantId: parcel.tenant_id,
    profileId: 'test-employee',
    branches: [{ id: parcel.current_org_unit_id, role: { permissions: ['COLLECT_PARCEL'] } } as any],
    warehouses: []
  };

  await new Promise<void>((resolve, reject) => {
    contextProvider.run({ 
      principal,
      requestId: 'test-req-id',
      correlationId: 'test-corr-id'
    }, async () => {
      try {
        console.log('Testing recordDelivery...');
        
        const result = await commandService.recordDelivery(parcel.tracking_number, {
          receivedByName: 'Sami',
        } as any, {
          signature: [{ buffer: Buffer.from('fake-signature-image'), mimetype: 'image/png' } as any]
        });
        console.log('POD Recorded successfully. ID:', result.id);
        resolve();
      } catch (e) {
        console.error('Test error:', e);
        resolve(); // resolve anyway to close app
      }
    });
  });

  await app.close();
}

bootstrap();
