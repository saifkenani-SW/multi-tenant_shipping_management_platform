const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.users.findUnique({ where: { email: 'employee@fastship.com' }});
  const employee = await prisma.employee.findFirst({ where: { user_id: user.id }});
  console.log('Employee:', employee);
  const assignments = await prisma.employee_assignment.findMany({ where: { employee_id: employee.id }});
  console.log('Assignments:', assignments);
  for (const a of assignments) {
     const orgUnit = await prisma.organization_unit.findUnique({ where: { id: a.organization_unit_id }});
     console.log('Org unit for assignment', a.id, orgUnit);
  }
}

run().finally(() => prisma.$disconnect());
