import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomInt, timingSafeEqual } from 'crypto';
import * as bcrypt from 'bcrypt';
import { prisma } from '@campus-connect/database';
import { getRedisClient } from '@campus-connect/cache';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ResendOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { parseStudentInfo } from '@campus-connect/common';
import { EmailService } from './email.service';

interface PendingRegistration {
  email: string;
  passwordHash: string;
  fullName: string;
  studentId?: string | null;
  major?: string | null;
  cohort?: string | null;
  otpCode: string;
  otpExpiry: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  private readonly genericOtpResponse = {
    message: 'Nếu email hợp lệ, mã xác minh đã được gửi',
  };

  private readonly genericPasswordResetResponse = {
    message: 'Nếu email hợp lệ, mã đặt lại mật khẩu đã được gửi',
  };

  private normalizeEmail(email: string) {
    const normalized = String(email ?? '')
      .trim()
      .toLowerCase();
    const parts = normalized.split('@');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new BadRequestException('Email không hợp lệ');
    }
    const domain = parts[1];
    if (!/^[a-z0-9.-]+$/.test(domain)) {
      throw new BadRequestException('Email không hợp lệ');
    }
    return { normalized, domain };
  }

  private getAllowedEmailDomains() {
    return (process.env.ALLOWED_EMAIL_DOMAINS ?? '')
      .split(',')
      .map((domain) => domain.trim().toLowerCase())
      .filter(Boolean);
  }

  private assertAllowedEmailDomain(email: string) {
    const { normalized, domain } = this.normalizeEmail(email);
    const allowedDomains = this.getAllowedEmailDomains();
    if (allowedDomains.length > 0 && !allowedDomains.includes(domain)) {
      throw new BadRequestException('Email không thuộc miền được phép');
    }
    return normalized;
  }

  private getOtpTtlMs() {
    return Number(process.env.OTP_TTL_MINUTES ?? 10) * 60 * 1000;
  }

  private pendingRegistrationKey(email: string) {
    return `pending_registration:email:${email}`;
  }

  private passwordResetKey(email: string) {
    return `password_reset:email:${email}`;
  }

  private generateOtp() {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private hashOtp(otp: string) {
    const secret = process.env.OTP_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('OTP_SECRET or JWT_SECRET is required');
    }
    return createHash('sha256').update(`${otp}:${secret}`).digest('hex');
  }

  private otpHashesEqual(a: string, b: string) {
    const left = Buffer.from(a, 'hex');
    const right = Buffer.from(b, 'hex');
    return left.length === right.length && timingSafeEqual(left, right);
  }

  private async canResendOtp(email: string, ip?: string) {
    const redis = getRedisClient();
    const emailCooldownKey = `otp_resend:email:${email}`;
    const emailHourlyKey = `otp_resend_hour:email:${email}`;
    const ipKey = `otp_resend:ip:${ip || 'unknown'}`;

    const [cooldown, hourly, ipCount] = await Promise.all([
      redis.get(emailCooldownKey),
      redis.incr(emailHourlyKey),
      redis.incr(ipKey),
    ]);

    if (hourly === 1) await redis.expire(emailHourlyKey, 60 * 60);
    if (ipCount === 1) await redis.expire(ipKey, 60 * 60);

    if (cooldown || hourly > 5 || ipCount > 30) return false;

    await redis.set(emailCooldownKey, '1', 'EX', 60);
    return true;
  }

  private async canVerifyOtp(email: string, ip?: string) {
    const redis = getRedisClient();
    const ipKey = `otp_verify:ip:${ip || 'unknown'}`;
    const emailKey = `otp_verify:email:${email}`;
    const [ipCount, emailCount] = await Promise.all([
      redis.incr(ipKey),
      redis.incr(emailKey),
    ]);
    if (ipCount === 1) await redis.expire(ipKey, 10 * 60);
    if (emailCount === 1) await redis.expire(emailKey, 10 * 60);
    return ipCount <= 60 && emailCount <= 20;
  }

  private async getOtpAttempts(email: string) {
    const redis = getRedisClient();
    const value = await redis.get(`otp_attempts:email:${email}`);
    return Number(value ?? 0);
  }

  private async incrementOtpAttempts(email: string) {
    const redis = getRedisClient();
    const key = `otp_attempts:email:${email}`;
    const count = await redis.incr(key);
    if (count === 1)
      await redis.expire(key, Math.ceil(this.getOtpTtlMs() / 1000));
    return count;
  }

  private async resetOtpAttempts(email: string) {
    await getRedisClient().del(`otp_attempts:email:${email}`);
  }

  private async issuePasswordResetOtp(email: string) {
    const otp = this.generateOtp();
    const otpHash = this.hashOtp(otp);
    await getRedisClient().set(
      this.passwordResetKey(email),
      JSON.stringify({
        otpCode: otpHash,
        otpExpiry: new Date(Date.now() + this.getOtpTtlMs()).toISOString(),
      }),
      'PX',
      this.getOtpTtlMs(),
    );
    await this.resetOtpAttempts(email);
    await this.emailService.sendPasswordResetEmail(email, otp);
  }

  private async issuePendingRegistrationOtp(
    email: string,
    registration: Omit<PendingRegistration, 'otpCode' | 'otpExpiry'>,
  ) {
    const otp = this.generateOtp();
    const otpHash = this.hashOtp(otp);
    await getRedisClient().set(
      this.pendingRegistrationKey(email),
      JSON.stringify({
        ...registration,
        otpCode: otpHash,
        otpExpiry: new Date(Date.now() + this.getOtpTtlMs()).toISOString(),
      }),
      'PX',
      this.getOtpTtlMs(),
    );
    await this.resetOtpAttempts(email);
    await this.emailService.sendOtpEmail(email, otp);
  }

  private async issueOtp(userId: string, email: string) {
    const otp = this.generateOtp();
    const otpHash = this.hashOtp(otp);
    await prisma.user.update({
      where: { id: userId },
      data: {
        otpCode: otpHash,
        otpExpiry: new Date(Date.now() + this.getOtpTtlMs()),
      },
    });
    await this.resetOtpAttempts(email);
    await this.emailService.sendOtpEmail(email, otp);
  }

  async register(registerDto: RegisterDto) {
    const { email, password, fullName } = registerDto;

    const normalizedEmail = this.assertAllowedEmailDomain(email);
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw new BadRequestException('Email đã tồn tại trong hệ thống');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const info = parseStudentInfo(email);

    await this.issuePendingRegistrationOtp(normalizedEmail, {
      email: normalizedEmail,
      passwordHash: hashedPassword,
      fullName,
      studentId: info.studentId,
      major: info.major,
      cohort: info.cohort,
    });

    return {
      message: 'Vui lòng kiểm tra email để lấy mã OTP và hoàn tất đăng ký.',
      pendingEmail: normalizedEmail,
    };
  }

  async verifyEmail(dto: VerifyEmailDto, ip?: string) {
    const normalizedEmail = this.assertAllowedEmailDomain(dto.email);
    if (!(await this.canVerifyOtp(normalizedEmail, ip))) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    if (
      (await this.getOtpAttempts(normalizedEmail)) >=
      Number(process.env.OTP_MAX_ATTEMPTS ?? 5)
    ) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    const pendingRaw = await getRedisClient().get(
      this.pendingRegistrationKey(normalizedEmail),
    );
    if (!pendingRaw) {
      // Check if it is an existing user verifying an email change (or an old DB OTP)
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (user && !user.emailVerified && user.otpCode && user.otpExpiry) {
        const submittedHash = this.hashOtp(dto.otp);
        if (
          new Date(user.otpExpiry) > new Date() &&
          this.otpHashesEqual(user.otpCode, submittedHash)
        ) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              emailVerified: true,
              isVerified: true,
              otpCode: null,
              otpExpiry: null,
            },
          });
          await this.resetOtpAttempts(normalizedEmail);
          return { message: 'Xác minh email thành công' };
        }
      }

      await this.incrementOtpAttempts(normalizedEmail);
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    const pending = JSON.parse(pendingRaw) as PendingRegistration;
    const submittedHash = this.hashOtp(dto.otp);
    if (
      !pending.otpCode ||
      !pending.otpExpiry ||
      new Date(pending.otpExpiry) <= new Date() ||
      !this.otpHashesEqual(pending.otpCode, submittedHash)
    ) {
      await this.incrementOtpAttempts(normalizedEmail);
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      // This should only happen if they changed email right after registering, or race condition.
      // If we reach here, we must clean up the pending registration.
      await getRedisClient().del(this.pendingRegistrationKey(normalizedEmail));
      await this.incrementOtpAttempts(normalizedEmail);
      throw new BadRequestException('Email đã tồn tại trong hệ thống');
    }

    await prisma.user.create({
      data: {
        email: pending.email,
        passwordHash: pending.passwordHash,
        fullName: pending.fullName,
        studentId: pending.studentId,
        major: pending.major,
        cohort: pending.cohort,
        role: 'STUDENT',
        emailVerified: true,
        isVerified: true,
        otpCode: null,
        otpExpiry: null,
      },
    });

    await this.resetOtpAttempts(normalizedEmail);
    await getRedisClient().del(this.pendingRegistrationKey(normalizedEmail));
    return { message: 'Xác minh email thành công' };
  }

  async resendOtp(dto: ResendOtpDto, ip?: string) {
    const normalizedEmail = this.assertAllowedEmailDomain(dto.email);

    if (!(await this.canResendOtp(normalizedEmail, ip))) {
      throw new HttpException(
        'Vui lòng chờ 60 giây trước khi gửi lại mã OTP.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const pendingRaw = await getRedisClient().get(
      this.pendingRegistrationKey(normalizedEmail),
    );

    if (pendingRaw) {
      const pending = JSON.parse(pendingRaw) as PendingRegistration;
      await this.issuePendingRegistrationOtp(normalizedEmail, {
        email: pending.email,
        passwordHash: pending.passwordHash,
        fullName: pending.fullName,
        studentId: pending.studentId,
        major: pending.major,
        cohort: pending.cohort,
      });
      return this.genericOtpResponse;
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, emailVerified: true },
    });

    if (!user || user.emailVerified) {
      throw new BadRequestException(
        'Phiên xác thực đã hết hạn. Vui lòng đăng ký lại.',
      );
    }

    await this.issueOtp(user.id, normalizedEmail);
    return this.genericOtpResponse;
  }

  async forgotPassword(dto: ForgotPasswordDto, ip?: string) {
    const normalizedEmail = this.assertAllowedEmailDomain(dto.email);

    if (!(await this.canResendOtp(normalizedEmail, ip))) {
      return this.genericPasswordResetResponse;
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        passwordHash: true,
        emailVerified: true,
        isVerified: true,
        isSuspended: true,
      },
    });

    if (
      !user ||
      !user.passwordHash ||
      !user.emailVerified ||
      !user.isVerified ||
      user.isSuspended
    ) {
      return this.genericPasswordResetResponse;
    }

    await this.issuePasswordResetOtp(normalizedEmail);
    return this.genericPasswordResetResponse;
  }

  async resetPassword(dto: ResetPasswordDto, ip?: string) {
    const normalizedEmail = this.assertAllowedEmailDomain(dto.email);
    if (!(await this.canVerifyOtp(normalizedEmail, ip))) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    if (
      (await this.getOtpAttempts(normalizedEmail)) >=
      Number(process.env.OTP_MAX_ATTEMPTS ?? 5)
    ) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    const resetRaw = await getRedisClient().get(
      this.passwordResetKey(normalizedEmail),
    );
    if (!resetRaw) {
      await this.incrementOtpAttempts(normalizedEmail);
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    const reset = JSON.parse(resetRaw) as {
      otpCode?: string;
      otpExpiry?: string;
    };
    const submittedHash = this.hashOtp(dto.otp);
    if (
      !reset.otpCode ||
      !reset.otpExpiry ||
      new Date(reset.otpExpiry) <= new Date() ||
      !this.otpHashesEqual(reset.otpCode, submittedHash)
    ) {
      await this.incrementOtpAttempts(normalizedEmail);
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    if (!dto.newPassword || dto.newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, passwordHash: true, isSuspended: true },
    });
    if (!user || !user.passwordHash || user.isSuspended) {
      await this.incrementOtpAttempts(normalizedEmail);
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    const salt = await bcrypt.genSalt();
    const newHash = await bcrypt.hash(dto.newPassword, salt);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    await Promise.all([
      this.resetOtpAttempts(normalizedEmail),
      getRedisClient().del(this.passwordResetKey(normalizedEmail)),
      getRedisClient().del(`refresh_token:${user.id}`),
    ]);

    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  async login(loginDto: LoginDto) {
    const { identifier, password } = loginDto;
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const studentInfo = parseStudentInfo(normalizedIdentifier);
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedIdentifier },
          ...(studentInfo.studentId
            ? [{ studentId: studentInfo.studentId }]
            : [{ studentId: normalizedIdentifier.toUpperCase() }]),
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

    if (!user.emailVerified || !user.isVerified || user.isSuspended) {
      throw new UnauthorizedException(
        'Không thể đăng nhập. Vui lòng kiểm tra thông tin hoặc trạng thái xác minh email.',
      );
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
    const profileSlug =
      String(user.studentId || user.email?.split('@')[0] || user.id)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '') || user.id;
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
        profileSlug,
        avatarUrl: user.avatarUrl,
        reputationScore: user.reputationScore,
        isVerified: user.isVerified,
        hasBlueBadge: user.hasBlueBadge,
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
      if (!user.emailVerified || !user.isVerified || user.isSuspended) {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }

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
