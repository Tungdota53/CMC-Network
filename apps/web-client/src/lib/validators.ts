import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,50}$/;

export const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email hoặc số điện thoại'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export const registerStep1Schema = z.object({
  email: z.string().email('Email không hợp lệ').endsWith('cmcu.edu.vn', 'Vui lòng sử dụng email trường CMC'),
  password: z.string().regex(passwordRegex, 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt'),
});

export const registerStep2Schema = z.object({
  fullName: z.string().min(2, 'Họ và tên quá ngắn').max(100, 'Họ và tên quá dài'),
  dateOfBirth: z.string().min(1, 'Vui lòng chọn ngày sinh'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    message: 'Vui lòng chọn giới tính'
  }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterStep1Data = z.infer<typeof registerStep1Schema>;
export type RegisterStep2Data = z.infer<typeof registerStep2Schema>;
