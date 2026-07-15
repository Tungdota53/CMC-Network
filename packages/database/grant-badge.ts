import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const usersToVerify = ['bit250109', 'bit250108'];

  // They might be username or email prefixes, let's search by string that contains them
  const result = await prisma.user.updateMany({
    where: {
      OR: usersToVerify.map((studentId) => ({
        email: { startsWith: studentId },
      })),
    },
    data: {
      hasBlueBadge: true
    }
  });
  
  console.log(`Successfully granted blue badge to ${result.count} users.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
