const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'test@cmc.edu.vn',
        fullName: 'Tùng Nguyễn',
        studentId: 'BIT250108',
        major: 'Công nghệ Thông tin',
        cohort: 'K4',
        bio: 'Đam mê lập trình Web',
        avatarUrl: 'https://i.pravatar.cc/150?img=11'
      }
    });
  } else {
    // Force ID to be known or we just use the first user's ID
    console.log(user.id);
  }
  
  console.log("USER_ID=" + user.id);
}

main().finally(() => prisma.$disconnect());
