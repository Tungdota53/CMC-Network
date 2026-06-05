import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { prisma } from '@campus-connect/database';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async register(registerDto: any) {
    const { email, password, fullName } = registerDto;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Email đã tồn tại trong hệ thống');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    let studentId = null;
    let cohort = null;
    let major = null;

    if (email.endsWith('@st.cmc.edu.vn') || email.endsWith('@st.cmcu.edu.vn')) {
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

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        fullName,
        studentId,
        major,
        cohort,
        role: 'STUDENT'
      },
    });

    return { message: 'Đăng ký thành công', userId: user.id };
  }

  async login(loginDto: any) {
    const { email: identifier, password } = loginDto;
    const user = await prisma.user.findFirst({ 
      where: { 
        OR: [
          { email: identifier.toLowerCase() },
          { studentId: identifier.toUpperCase() }
        ]
      } 
    });

    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: { id: user.id, email: user.email, fullName: user.fullName }
    };
  }
}
