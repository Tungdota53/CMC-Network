import { PrismaClient } from '@campus-connect/database';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { fullName: { contains: 'Tùng Nguyễn' } },
        { studentId: { startsWith: 'BIT250' } }
      ]
    }
  });

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true }
    });
    console.log(`Đã cấp Tick Xanh thành công cho tài khoản: ${user.fullName} (${user.email})`);
  } else {
    console.log('Không tìm thấy tài khoản để cấp Tick Xanh.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
