const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const user = await prisma.user.updateMany({
    where: { studentId: { equals: 'bit250100', mode: 'insensitive' } },
    data: { isVerified: true }
  });
  console.log('Updated:', user);
}
run();
