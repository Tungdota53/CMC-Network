const { PrismaClient } = require('./packages/database/dist/index.js');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin@123456', 10);
  await prisma.user.update({
    where: { email: 'admin@cmc.edu.vn' },
    data: { passwordHash: hash }
  });
  console.log('Password reset to Admin@123456');
}

main().catch(console.error).finally(() => prisma.$disconnect());
