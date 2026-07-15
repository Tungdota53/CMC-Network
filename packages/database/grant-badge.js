const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: {
      OR: [
        { email: { startsWith: 'bit250109' } },
        { email: { startsWith: 'bit250108' } }
      ]
    },
    data: {
      hasBlueBadge: true
    }
  });
  console.log(`Successfully granted blue badge to ${result.count} users.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
