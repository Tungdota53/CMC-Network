const { PrismaClient } = require('./packages/database/dist/index.js');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { email: { contains: 'admin' } },
    select: { id: true, email: true, fullName: true, studentId: true, role: true, passwordHash: true }
  });
  console.log('Admin user:', JSON.stringify(admin, null, 2));

  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true },
    take: 10
  });
  console.log('All users (first 10):', JSON.stringify(allUsers, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
