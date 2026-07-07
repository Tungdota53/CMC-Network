import { PrismaClient } from '@campus-connect/database';

const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: 'bit250109' } }
  });
  console.log('Found users:', users.map(u => u.email));
  if (users.length > 0) {
    await prisma.user.update({
      where: { id: users[0].id },
      data: { isVerified: true }
    });
    console.log('Verified user', users[0].email);
  } else {
    console.log('User not found.');
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
