import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { prisma } from '@campus-connect/database';
import { getRedisClient } from '@campus-connect/cache';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { parseStudentInfo } from '@campus-connect/common';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName } = registerDto;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Email đã tồn tại trong hệ thống');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const info = parseStudentInfo(email);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        fullName,
        studentId: info.studentId,
        major: info.major,
        cohort: info.cohort,
        role: 'STUDENT',
      },
    });

    return { message: 'Đăng ký thành công', userId: user.id };
  }

  async login(loginDto: LoginDto) {
    const { identifier, password } = loginDto;
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { studentId: identifier.toUpperCase() },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Tài khoản chỉ hỗ trợ đăng nhập qua Microsoft',
      );
    }

    if (!(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }

    if (user.twoFactorStatus === 'ENABLED') {
      const temp2faToken = await this.jwtService.signAsync(
        { sub: user.id, type: '2FA_TEMP' },
        { expiresIn: '5m' },
      );
      return {
        requires2FA: true,
        temp2faToken,
      };
    }

    // Track activity for DAU/MAU analytics.
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.generateTokens(user);
  }

  async verify2FALogin(temp2faToken: string, token: string) {
    let userId: string;
    try {
      const payload = await this.jwtService.verifyAsync(temp2faToken);
      if (payload.type !== '2FA_TEMP') {
        throw new Error('Invalid token type');
      }
      userId = payload.sub;
    } catch {
      throw new UnauthorizedException('Token 2FA không hợp lệ hoặc đã hết hạn');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.twoFactorStatus !== 'ENABLED' || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA không hợp lệ');
    }

    const isValid = authenticator.verify({
      token,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Mã 2FA không chính xác');
    }

    // Track activity for DAU/MAU analytics.
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.generateTokens(user);
  }

  public async generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });
    const refresh_token = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    const redis = getRedisClient();
    await redis.set(
      `refresh_token:${user.id}`,
      refresh_token,
      'EX',
      7 * 24 * 60 * 60,
    );

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken);
      const userId = payload.sub;

      const redis = getRedisClient();
      const storedToken = await redis.get(`refresh_token:${userId}`);

      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException(
          'Refresh token không hợp lệ hoặc đã hết hạn',
        );
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User không tồn tại');

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
  }

  async enable2FA(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User không tồn tại');

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(
      user.email,
      'CampusConnect',
      secret,
    );

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    const qrCode = await qrcode.toDataURL(otpauthUrl);

    return {
      ...(process.env.NODE_ENV !== 'production' && { secret }),
      qrCode,
    };
  }

  async verify2FAAndEnable(userId: string, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('Chưa tạo secret 2FA');
    }

    const isValid = authenticator.verify({
      token,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new BadRequestException('Mã xác thực không chính xác');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorStatus: 'ENABLED' },
    });

    return { message: 'Bật 2FA thành công' };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Không tìm thấy tài khoản');
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }

    const salt = await bcrypt.genSalt();
    const newHash = await bcrypt.hash(newPassword, salt);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    const redis = getRedisClient();
    await redis.del(`refresh_token:${userId}`);

    return { message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }
}
