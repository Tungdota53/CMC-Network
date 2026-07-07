import { PrismaClient } from '@campus-connect/database';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error('ADMIN_PASSWORD is required');
  }

  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
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
  console.log('Admin user created successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
