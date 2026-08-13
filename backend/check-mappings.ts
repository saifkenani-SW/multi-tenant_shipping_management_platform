import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const mappings = await prisma.$queryRaw`SELECT * FROM org_unit_location_mapping LIMIT 10`;
  console.log(mappings);
}
main().catch(console.error).finally(() => prisma.$disconnect());
