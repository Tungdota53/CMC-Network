import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old data...');
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding Database...');

  // Create Users
  const user1 = await prisma.user.create({
    data: {
      email: 'nguyenvana@cmc.edu.vn',
      fullName: 'Nguyễn Văn A',
      studentId: 'SV001',
      department: 'CNTT',
      major: 'KTPM',
      cohort: 'K15',
      reputationScore: 100,
    }
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'tranvanb@cmc.edu.vn',
      fullName: 'Trần Văn B',
      studentId: 'SV002',
      department: 'Kinh Tế',
      reputationScore: 250,
    }
  });

  // Create Posts
  await prisma.post.create({
    data: {
      userId: user1.id,
      content: 'Hôm nay giảng viên cho bài tập về React đỉnh quá các bác ạ. Em code cả đêm mà giao diện vẫn mượt mà không tì vết. Chia sẻ chút thành quả cho anh em lấy động lực học code nhé! 🔥🚀',
      type: 'TEXT',
      visibility: 'PUBLIC',
      likes: 1200,
      commentCount: 120,
      shareCount: 45
    }
  });

  await prisma.post.create({
    data: {
      userId: user2.id,
      content: 'Có ai đang ôn thi Xác suất thống kê không? Vào nhóm Discord mình học chung cho có động lực nhé!',
      type: 'TEXT',
      visibility: 'PUBLIC',
      likes: 56,
      commentCount: 12,
      shareCount: 2
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
