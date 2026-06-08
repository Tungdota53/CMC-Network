import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  /** Email trường hoặc Mã sinh viên. */
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập email hoặc mã sinh viên' })
  @MaxLength(120)
  identifier!: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(72, { message: 'Mật khẩu quá dài' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập họ tên' })
  @MaxLength(120)
  fullName!: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập tài khoản' })
  @MaxLength(120)
  identifier!: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu' })
  @MaxLength(72)
  password!: string;
}
