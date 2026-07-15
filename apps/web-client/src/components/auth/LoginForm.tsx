'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validators';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';

const getErrorMessage = (err: any, fallback: string) => {
  const raw = err?.error?.message || err?.response?.data?.error?.message || err?.message;
  return Array.isArray(raw) ? raw.join('; ') : String(raw || fallback);
};

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const STUDENT_EMAIL_DOMAIN = '@st.cmc.edu.vn';

const isStudentCode = (value: string) => /^[a-z]{2,}\d{4,}$/i.test(value.trim());
const authInputClass = 'auth-input relative z-10 h-12 border-white/20 !bg-slate-950/35 text-white caret-blue-300 shadow-inner placeholder:text-slate-400 hover:!bg-slate-950/35 focus:border-blue-300/70 focus:!bg-slate-950/55 focus:ring-blue-400/40';

const normalizeIdentifier = (value: string) => {
  const trimmed = value.trim();
  if (isValidEmail(trimmed)) return trimmed.toLowerCase();
  if (isStudentCode(trimmed)) return `${trimmed.toLowerCase()}${STUDENT_EMAIL_DOMAIN}`;
  return trimmed;
};

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [globalError, setGlobalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [showOtpVerify, setShowOtpVerify] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    shouldFocusError: false,
  });

  const identifier = watch('email');
  const needsEmailVerification = globalError.toLowerCase().includes('xác minh email');
  const identifierText = String(identifier || '').trim();
  const otpNeedsFullEmail = needsEmailVerification && identifierText && !isValidEmail(identifierText);

  const onSubmit = async (data: LoginFormData) => {
    setGlobalError('');
    setSuccessMessage('');
    const identifier = normalizeIdentifier(data.email);
    setValue('email', identifier, { shouldValidate: true });
    try {
      await login(identifier, data.password);
      router.push('/feed');
    } catch (err: any) {
      setGlobalError(getErrorMessage(err, 'Đăng nhập thất bại. Vui lòng thử lại.'));
    }
  };

  const onResendOtp = async () => {
    const normalizedEmail = normalizeIdentifier(String(identifier || ''));
    setValue('email', normalizedEmail, { shouldValidate: true });

    if (!normalizedEmail) {
      setGlobalError('Vui lòng nhập email để gửi lại mã OTP.');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setGlobalError('Gửi lại OTP cần email, không dùng tên đăng nhập hoặc mã sinh viên.');
      return;
    }

    setIsResendingOtp(true);
    setGlobalError('');
    setSuccessMessage('');
    try {
      await api.post('/auth/resend-otp', { email: normalizedEmail });
      setSuccessMessage('Nếu email hợp lệ, mã OTP mới đã được gửi. Vui lòng kiểm tra cả Thư rác/Spam/Junk.');
      setShowOtpVerify(true);
    } catch (err: any) {
      setGlobalError(getErrorMessage(err, 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.'));
    } finally {
      setIsResendingOtp(false);
    }
  };

  const onVerifyOtp = async () => {
    const normalizedEmail = normalizeIdentifier(String(identifier || ''));
    setValue('email', normalizedEmail, { shouldValidate: true });

    if (!normalizedEmail) {
      setGlobalError('Vui lòng nhập email trước khi xác minh OTP.');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setGlobalError('Xác minh OTP cần email đã đăng ký, không dùng tên đăng nhập hoặc mã sinh viên.');
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setGlobalError('Mã OTP phải gồm đúng 6 chữ số.');
      return;
    }

    setIsVerifyingOtp(true);
    setGlobalError('');
    setSuccessMessage('');
    try {
      await api.post('/auth/verify-email', { email: normalizedEmail, otp: otp.trim() });
      setSuccessMessage('Xác minh email thành công. Đang đăng nhập...');

      const password = getValues('password');
      if (password) {
        await login(normalizedEmail, password);
        router.push('/feed');
        return;
      }

      setShowOtpVerify(false);
      setOtp('');
      setSuccessMessage('Xác minh email thành công. Vui lòng nhập mật khẩu rồi đăng nhập lại.');
    } catch (err: any) {
      setGlobalError(getErrorMessage(err, 'Không thể xác minh OTP. Vui lòng kiểm tra lại mã.'));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {globalError && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 text-center border border-red-200 font-medium space-y-3">
          <p>{globalError}</p>
          {otpNeedsFullEmail && (
            <p className="text-xs text-red-500">
              Tài khoản cần xác minh email. Hệ thống sẽ tự chuyển mã sinh viên thành email dạng mã sinh viên@st.cmc.edu.vn để gửi lại OTP.
            </p>
          )}
          {needsEmailVerification && (
            <button
              type="button"
              onClick={onResendOtp}
              disabled={isResendingOtp}
              className="text-blue-600 hover:text-blue-700 underline underline-offset-4 disabled:opacity-60"
            >
              {isResendingOtp ? 'Đang gửi OTP...' : 'Gửi lại mã OTP xác minh'}
            </button>
          )}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700 text-center border border-green-200 font-medium">
          {successMessage}
        </div>
      )}

      {showOtpVerify && (
        <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-4 space-y-3">
          <div className="text-sm text-blue-100 font-medium text-left">
            Nhập mã OTP đã gửi về email để xác minh tài khoản hiện có.
          </div>
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            placeholder="Nhập mã OTP 6 số"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
            icon={<ShieldCheck className="w-5 h-5 text-slate-400" />}
            className={authInputClass}
          />
          <Button
            type="button"
            onClick={onVerifyOtp}
            isLoading={isVerifyingOtp}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl h-11"
          >
            Xác minh OTP và đăng nhập
          </Button>
        </div>
      )}

      <div className="space-y-2 text-left">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-1 pl-1">
          Email hoặc mã sinh viên <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          autoComplete="username"
          placeholder="VD: masv hoặc masv@st.cmc.edu.vn"
          icon={<Mail className="w-5 h-5 text-slate-400" />}
          {...register('email')}
          onBlur={(event) => {
            const normalized = normalizeIdentifier(event.target.value);
            if (normalized !== event.target.value.trim()) {
              setValue('email', normalized, { shouldValidate: true });
            }
          }}
          error={errors.email?.message}
          className={authInputClass}
        />
      </div>

      <div className="space-y-2 text-left">
        <div className="flex justify-between items-center pl-1 pr-1">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
            Mật khẩu <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              router.push('/forgot-password');
            }}
            onClick={() => router.push('/forgot-password')}
            className="relative z-30 -m-2 rounded-lg p-2 text-xs font-medium text-blue-400 transition-colors hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
          >
            Quên mật khẩu?
          </button>
        </div>
        <Input
          type="password"
          autoComplete="current-password"
          placeholder="Nhập mật khẩu"
          icon={<Lock className="w-5 h-5 text-slate-400" />}
          {...register('password')}
          error={errors.password?.message}
          className={authInputClass}
        />
      </div>

      <Button
        type="submit"
        className="sticky bottom-[calc(env(safe-area-inset-bottom)+8px)] z-10 mt-4 h-12 w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-blue-600 to-indigo-600 text-[15px] font-bold text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] transition-all hover:from-blue-500 hover:to-indigo-500 sm:static"
        isLoading={isSubmitting}
      >
        <span className="relative z-10 flex items-center gap-2">
          Đăng nhập
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </span>
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
      </Button>

      <div className="relative flex items-center py-2 mt-4">
        <div className="flex-grow border-t border-white/10"></div>
        <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-medium">hoặc tiếp tục với</span>
        <div className="flex-grow border-t border-white/10"></div>
      </div>

      <Button
        type="button"
        className="w-full bg-white/5 hover:bg-white/10 text-slate-200 font-semibold border border-white/10 rounded-xl h-12 text-[14px] flex items-center justify-center gap-3 shadow-sm transition-all"
        onClick={() => {
          // Xử lý OAuth Microsoft
          window.location.href = '/api/auth/microsoft';
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 21 21"><path fill="#f25022" d="M1 1h9v9H1z"/><path fill="#00a4ef" d="M1 11h9v9H1z"/><path fill="#7fba00" d="M11 1h9v9h-9z"/><path fill="#ffb900" d="M11 11h9v9h-9z"/></svg>
        Microsoft 365
      </Button>
    </form>
  );
}
