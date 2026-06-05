import { PrismaClient } from '@campus-connect/database';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@cmc.edu.vn' },
    update: { 
      role: 'ADMIN', 
      passwordHash: hashedPassword,
      studentId: 'ADMIN' 
    },
    create: {
      email: 'admin@cmc.edu.vn',
      fullName: 'Quản Trị Viên',
      studentId: 'ADMIN',
      role: 'ADMIN',
      passwordHash: hashedPassword,
    }
  });
  console.log('Admin account created successfully.');
  console.log('Email: admin@cmc.edu.vn');
  console.log('Password: admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
