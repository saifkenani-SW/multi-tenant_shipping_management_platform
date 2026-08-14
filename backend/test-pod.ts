import { PrismaClient, ParcelStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  let parcel = await prisma.parcel.findFirst({
    where: { current_status: ParcelStatus.READY_FOR_COLLECTION }
  });

  if (!parcel) {
    console.log("No parcel found in READY_FOR_COLLECTION, updating one...");
    parcel = await prisma.parcel.findFirst();
    if (!parcel) {
      console.log("No parcels in DB!");
      return;
    }
    parcel = await prisma.parcel.update({
      where: { id: parcel.id },
      data: { current_status: ParcelStatus.READY_FOR_COLLECTION }
    });
  }

  console.log("Using parcel with tracking:", parcel.tracking_number);
}

main().catch(console.error).finally(() => prisma.$disconnect());
