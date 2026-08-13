import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.$queryRaw`SELECT count(*) FROM global_location`;
  console.log(count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
