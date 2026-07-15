import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({
    where: { content: "" }
  });
  
  let deletedCount = 0;
  for (const post of posts) {
    if (!post.mediaUrls || post.mediaUrls.length === 0) {
      if (!post.pollOptions) {
        await prisma.post.delete({ where: { id: post.id } });
        deletedCount++;
      }
    }
  }
  console.log(`Deleted ${deletedCount} empty posts safely.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
