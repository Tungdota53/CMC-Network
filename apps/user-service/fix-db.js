const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: '@st.cmc.edu.vn' }, major: null }
  });
  
  const majorMap = {
    'AI': 'Trí tuệ Nhân tạo',
    'BA': 'Quản trị Kinh doanh',
    'CB': 'Tiếng Trung Thương mại',
    'CL': 'Ngôn ngữ Trung Quốc',
    'CS': 'Khoa học Máy tính',
    'DA': 'Thiết kế Mỹ thuật số',
    'EC': 'Công nghệ Kỹ thuật Điện tử - Viễn thông',
    'EM': 'Thương mại Điện tử',
    'GA': 'Đồ họa Game',
    'GD': 'Thiết kế Đồ họa',
    'IB': 'Kinh doanh Quốc tế',
    'IT': 'Công nghệ Thông tin',
    'KL': 'Ngôn ngữ Hàn Quốc',
    'LS': 'Logistics và Quản lý chuỗi cung ứng',
    'MC': 'Truyền thông Đa phương tiện',
    'NS': 'An ninh Mạng',
    'PR': 'Quan hệ Công chúng',
    'SE': 'Kỹ thuật Phần mềm'
  };

  for (const user of users) {
    const studentId = user.email.split('@')[0].toUpperCase();
    const match = studentId.match(/^([A-Za-z]+)(\d{2})\d+$/);
    
    if (match) {
      const letters = match[1].toUpperCase();
      const yearPrefix = parseInt(match[2]);
      const cohortNum = yearPrefix - 21;
      const cohort = cohortNum > 0 ? `K${cohortNum}` : null;
      
      const majorCode = letters.length >= 2 ? letters.slice(-2) : letters;
      const major = majorMap[majorCode] || null;
      
      await prisma.user.update({
        where: { id: user.id },
        data: { studentId, major, cohort }
      });
      console.log('Updated', user.email, 'to', major, cohort);
    }
  }
}

run();
