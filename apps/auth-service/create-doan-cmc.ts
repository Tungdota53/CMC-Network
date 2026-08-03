import { PrismaClient } from '@campus-connect/database';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = process.env.ACCOUNT_PASSWORD;

  if (!password) {
    throw new Error('ACCOUNT_PASSWORD is required');
  }

  if (password.length < 12) {
    throw new Error('ACCOUNT_PASSWORD must be at least 12 characters');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email: 'doanthanhnien@cmc.edu.vn' },
    update: {
      role: 'CLUB_LEADER',
      passwordHash: hashedPassword,
      studentId: 'DOANCMC',
      fullName: 'Đoàn Thanh Niên CMC',
      emailVerified: true,
      isVerified: true,
      hasBlueBadge: true,
      bio: 'Trang chính thức của Đoàn Thanh niên Trường Đại học CMC',
    },
    create: {
      email: 'doanthanhnien@cmc.edu.vn',
      fullName: 'Đoàn Thanh Niên CMC',
      studentId: 'DOANCMC',
      role: 'CLUB_LEADER',
      passwordHash: hashedPassword,
      emailVerified: true,
      isVerified: true,
      hasBlueBadge: true,
      bio: 'Trang chính thức của Đoàn Thanh niên Trường Đại học CMC',
    },
  });

  console.log('✅ Tài khoản Đoàn Thanh Niên CMC đã được tạo thành công!');
  console.log(`   ID:       ${user.id}`);
  console.log(`   Email:    ${user.email}`);
  console.log(`   Họ tên:   ${user.fullName}`);
  console.log(`   Role:     ${user.role}`);
  console.log(`   Tích xanh: ${user.hasBlueBadge ? '✅ Đã cấp' : '❌ Chưa cấp'}`);
  console.log(`   Verified:  ${user.isVerified ? '✅' : '❌'}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());