import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@campus-connect/database';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AppService {
  private prisma = new PrismaClient();

  getHello(): string {
    return 'Auth Service is running!';
  }

  async register(data: any) {
    const { identifier, password, fullName } = data;
    
    // 1. Validate
    if (!identifier || !password || !fullName) {
      throw new BadRequestException('Vui lòng điền đầy đủ thông tin');
    }

    // 2. Parse identifier (Email or Student ID)
    let email = '';
    let studentId = '';
    
    if (identifier.includes('@')) {
      email = identifier.toLowerCase();
      if (email.endsWith('@st.cmc.edu.vn') || email.endsWith('@st.cmcu.edu.vn')) {
        studentId = email.split('@')[0].toUpperCase();
      }
    } else {
      studentId = identifier.toUpperCase();
      email = `${studentId.toLowerCase()}@st.cmc.edu.vn`; // Fake email if only student ID is provided
    }

    // 3. Check existing user
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(studentId ? [{ studentId }] : [])
        ]
      }
    });

    if (existingUser) {
      throw new BadRequestException('Tài khoản (Email hoặc Mã SV) đã tồn tại trong hệ thống');
    }

    // 4. Hash password
    let cohort = null;
    let major = null;
    if (studentId) {
      // Ví dụ: BIT250108
      // Phân tích chuỗi: Chữ cái đầu (B + IT), 2 số tiếp theo (25)
      const match = studentId.match(/^([A-Za-z]+)(\d{2})\d+$/);
      if (match) {
        const letters = match[1].toUpperCase(); // VD: BIT
        const yearPrefix = parseInt(match[2]);  // VD: 25

        // Khóa 1 là 2022 (22) -> Khóa = Năm - 21
        const cohortNum = yearPrefix - 21; 
        if (cohortNum > 0) {
          cohort = `K${cohortNum}`;
        }

        // Bảng mã chuyên ngành CMC
        const majorMap: Record<string, string> = {
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

        // Lấy 2 chữ cái cuối trong phần chữ (VD: BIT -> IT)
        const majorCode = letters.length >= 2 ? letters.slice(-2) : letters;
        if (majorMap[majorCode]) {
          major = majorMap[majorCode];
        }
      }
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        email: email,
        passwordHash: hashedPassword,
        fullName,
        studentId: studentId || null,
        department: 'Chưa cập nhật',
        major: major,
        cohort: cohort,
        role: 'STUDENT'
      }
    });

    // Remove password hash from response
    const { passwordHash, ...result } = user;
    return {
      message: 'Đăng ký thành công!',
      user: result
    };
  }

  async login(data: any) {
    const { identifier, password } = data;

    if (!identifier || !password) {
      throw new BadRequestException('Vui lòng nhập tài khoản và mật khẩu');
    }

    let email = '';
    let studentId = '';
    
    if (identifier.includes('@')) {
      email = identifier.toLowerCase();
    } else {
      studentId = identifier.toUpperCase();
      email = `${studentId.toLowerCase()}@st.cmc.edu.vn`;
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(studentId ? [{ studentId }] : [])
        ]
      }
    });

    if (!user || !user.passwordHash) {
      throw new BadRequestException('Tài khoản không tồn tại');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Sai mật khẩu');
    }

    const { passwordHash, ...result } = user;
    return {
      message: 'Đăng nhập thành công!',
      user: result,
      token: 'mock_jwt_token_for_now' // In real app, generate JWT here
    };
  }

  async validateOAuthLogin(profile: any) {
    const { email, fullName, providerId, provider } = profile;
    
    // Tìm user theo email
    let user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Nếu chưa có, tự động tạo tài khoản sinh viên
      let studentId = null;
      let cohort = null;
      let major = null;

      if (email.endsWith('@st.cmc.edu.vn')) {
        studentId = email.split('@')[0].toUpperCase();
        
        const match = studentId.match(/^([A-Za-z]+)(\d{2})\d+$/);
        if (match) {
          const letters = match[1].toUpperCase();
          const yearPrefix = parseInt(match[2]);

          const cohortNum = yearPrefix - 21; 
          if (cohortNum > 0) {
            cohort = `K${cohortNum}`;
          }

          const majorMap: Record<string, string> = {
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

          const majorCode = letters.length >= 2 ? letters.slice(-2) : letters;
          if (majorMap[majorCode]) {
            major = majorMap[majorCode];
          }
        }
      }

      user = await this.prisma.user.create({
        data: {
          email,
          fullName,
          studentId,
          major,
          cohort,
          role: 'STUDENT'
        }
      });
    }

    return user;
  }
}
