import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TEMP_DOMAINS = ['members.example.com', 'student.cmc.example', 'st.cmcu.edu.vn'];
const TEMP_DOMAIN = 'st.cmcu.edu.vn';
const COUNT = 75;

const familyNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
const middleNames = ['Minh', 'Thanh', 'Ngọc', 'Khánh', 'Quang', 'Thu', 'Gia', 'Đức', 'Anh', 'Hải'];
const givenNames = ['An', 'Bình', 'Châu', 'Dũng', 'Giang', 'Hà', 'Hân', 'Huy', 'Khang', 'Linh', 'Long', 'Mai', 'Nam', 'Phúc', 'Quân', 'Trang', 'Trâm', 'Tuấn', 'Vy', 'Yến'];
const profiles = [
  ['BIT', 'Công nghệ Thông tin', 'Kỹ thuật phần mềm'],
  ['BCS', 'Công nghệ Thông tin', 'Khoa học máy tính'],
  ['BBA', 'Kinh tế', 'Quản trị kinh doanh'],
  ['BMK', 'Kinh tế', 'Marketing'],
  ['BEL', 'Ngôn ngữ', 'Ngôn ngữ Anh'],
];

function member(index) {
  const familyName = familyNames[index % familyNames.length];
  const middleName = middleNames[(index * 3) % middleNames.length];
  const givenName = givenNames[(index * 7) % givenNames.length];
  const [programCode, department, major] = profiles[index % profiles.length];
  const serial = String(index + 1).padStart(3, '0');
  const emailSerial = String(108 + index).padStart(4, '0');

  return {
    email: `${programCode}25${emailSerial}@${TEMP_DOMAIN}`.toLowerCase(),
    fullName: `${familyName} ${middleName} ${givenName}`,
    studentId: `TEMP26${serial}`,
    department,
    major,
    cohort: `K${16 + (index % 4)}`,
    bio: 'Tài khoản thành viên mẫu — có thể xóa an toàn.',
    reputationScore: 10 + ((index * 17) % 490),
    emailVerified: true,
    isVerified: true,
    passwordHash: null,
  };
}

async function add() {
  const users = Array.from({ length: COUNT }, (_, index) => member(index));
  const result = await prisma.user.createMany({ data: users, skipDuplicates: true });
  const total = await prisma.user.count({ where: { email: { endsWith: `@${TEMP_DOMAIN}` } } });
  console.log(`Đã thêm ${result.count}; hiện có ${total} thành viên tạm.`);
}

async function remove() {
  const result = await prisma.user.deleteMany({
    where: {
      studentId: { startsWith: 'TEMP26' },
      OR: TEMP_DOMAINS.map((domain) => ({ email: { endsWith: `@${domain}` } })),
    },
  });
  console.log(`Đã xóa ${result.count} thành viên tạm.`);
}

const action = process.argv[2];
if (!['add', 'remove'].includes(action)) {
  throw new Error('Cách dùng: node scripts/temp-members.mjs <add|remove>');
}

try {
  await (action === 'add' ? add() : remove());
} finally {
  await prisma.$disconnect();
}
