import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toLowerCase(),
  )
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  fullName: string;
}

export class LoginDto {
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toLowerCase(),
  )
  @IsString()
  @IsNotEmpty({
    message: 'Tài khoản (email hoặc mã sinh viên) không được để trống',
  })
  identifier: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  newPassword: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class Verify2FAAndEnableDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class Verify2FALoginDto {
  @IsString()
  @IsNotEmpty()
  temp2faToken: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}

export class VerifyEmailDto {
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toLowerCase(),
  )
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Mã OTP phải gồm đúng 6 chữ số' })
  otp: string;
}

export class ResendOtpDto {
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toLowerCase(),
  )
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;
}

export class ForgotPasswordDto {
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toLowerCase(),
  )
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;
}

export class ResetPasswordDto {
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toLowerCase(),
  )
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Mã OTP phải gồm đúng 6 chữ số' })
  otp: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  newPassword: string;
}
