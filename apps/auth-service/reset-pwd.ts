import { PrismaClient } from '@campus-connect/database';
import * as bcrypt from 'bcryptjs'; // auth-service might use bcryptjs or bcrypt

const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: 'bit250109' } }
  });
  
  if (users.length === 0) {
    console.log('Không tìm thấy tài khoản nào bắt đầu bằng bit250109.');
    return;
  }
  
  const user = users[0];
  const newPassword = 'Password123!';
  
  // Hash password
  let hashedPassword;
  try {
    const bcryptLib = require('bcryptjs');
    hashedPassword = await bcryptLib.hash(newPassword, 10);
  } catch (e) {
    try {
      const bcryptLib = require('bcrypt');
      hashedPassword = await bcryptLib.hash(newPassword, 10);
    } catch (e2) {
      console.error('Không tìm thấy thư viện bcrypt hoặc bcryptjs.');
      return;
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashedPassword }
  });
  
  console.log(`Đã reset mật khẩu thành công cho tài khoản ${user.email}`);
  console.log(`Mật khẩu mới là: ${newPassword}`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
