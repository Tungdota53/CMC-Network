'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const authInputClass = 'auth-input relative z-10 h-12 border-white/20 !bg-slate-950/35 text-white caret-blue-300 shadow-inner placeholder:text-slate-400 hover:!bg-slate-950/35 focus:border-blue-300/70 focus:!bg-slate-950/55 focus:ring-blue-400/40 disabled:!bg-slate-950/25 disabled:text-slate-400';

const getErrorMessage = (err: any, fallback: string) => {
  const raw = err?.error?.message || err?.response?.data?.error?.message || err?.message;
  return Array.isArray(raw) ? raw.join('; ') : String(raw || fallback);
};

const ALLOWED_STUDENT_EMAIL_DOMAINS = ['st.cmc.edu.vn', 'st.cmcu.edu.vn'];

const isAllowedStudentEmail = (value: string) => {
  const parts = value.split('@');
  return parts.length === 2 && ALLOWED_STUDENT_EMAIL_DOMAINS.includes(parts[1]);
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const normalizedEmail = email.trim().toLowerCase();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const requestOtp = async () => {
    if (step === 'reset' && resendCooldown > 0) {
      setError(`Vui lòng chờ ${resendCooldown} giây trước khi gửi lại mã.`);
      return;
    }
    if (!normalizedEmail) {
      setError('Vui lòng nhập email đã đăng ký.');
      return;
    }
    if (!isAllowedStudentEmail(normalizedEmail)) {
      setError('Vui lòng nhập email sinh viên CMC hợp lệ, ví dụ: masv@st.cmc.edu.vn hoặc masv@st.cmcu.edu.vn.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/auth/forgot-password', { email: normalizedEmail });
      setMessage(res.data?.data?.message || 'Nếu email hợp lệ, mã đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra cả Thư rác/Spam/Junk.');
      setStep('reset');
      setResendCooldown(60);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Không thể gửi mã đặt lại mật khẩu. Vui lòng thử lại sau.'));
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Mã OTP phải gồm đúng 6 chữ số.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/auth/reset-password', {
        email: normalizedEmail,
        otp: otp.trim(),
        newPassword,
      });
      setMessage(res.data?.data?.message || 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.');
      setTimeout(() => router.push('/login'), 900);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Không thể đặt lại mật khẩu. Vui lòng kiểm tra mã OTP.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col h-full">
      <div className="text-left mb-6">
        <h1 className="text-2xl font-semibold text-white mb-1 font-display">Quên mật khẩu?</h1>
        <p className="text-sm text-slate-400">Nhập email sinh viên để nhận mã OTP đặt lại mật khẩu.</p>
      </div>

      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          void (step === 'request' ? requestOtp() : resetPassword());
        }}
      >
        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 text-center border border-red-200 font-medium">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700 text-center border border-green-200 font-medium">
            {message}
          </div>
        )}

        <div className="space-y-2 text-left">
          <label htmlFor="forgot-email" className="text-sm font-medium text-slate-300 flex items-center gap-1 pl-1">
            Email đã đăng ký <span className="text-red-500">*</span>
          </label>
          <Input
            id="forgot-email"
            type="email"
            autoComplete="email"
            placeholder="VD: masv@st.cmc.edu.vn"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => setEmail(normalizedEmail)}
            disabled={step === 'reset'}
            icon={<Mail className="w-5 h-5 text-slate-400" />}
            className={authInputClass}
          />
        </div>

        {step === 'reset' && (
          <>
            <div className="space-y-2 text-left">
              <label htmlFor="forgot-otp" className="text-sm font-medium text-slate-300 flex items-center gap-1 pl-1">
                Mã OTP <span className="text-red-500">*</span>
              </label>
              <Input
                id="forgot-otp"
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
            </div>

            <div className="space-y-2 text-left">
              <label htmlFor="forgot-new-password" className="text-sm font-medium text-slate-300 flex items-center gap-1 pl-1">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <Input
                id="forgot-new-password"
                type="password"
                autoComplete="new-password"
                placeholder="Tối thiểu 6 ký tự"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                icon={<KeyRound className="w-5 h-5 text-slate-400" />}
                className={authInputClass}
              />
            </div>

            <div className="space-y-2 text-left">
              <label htmlFor="forgot-confirm-password" className="text-sm font-medium text-slate-300 flex items-center gap-1 pl-1">
                Nhập lại mật khẩu <span className="text-red-500">*</span>
              </label>
              <Input
                id="forgot-confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                icon={<KeyRound className="w-5 h-5 text-slate-400" />}
                className={authInputClass}
              />
            </div>
          </>
        )}

        <Button
          type="submit"
          isLoading={isLoading}
          className="sticky bottom-[calc(env(safe-area-inset-bottom)+8px)] z-10 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl h-12 text-[15px] shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] transition-all border border-white/10 sm:static"
        >
          {step === 'request' ? 'Gửi mã OTP' : 'Đặt lại mật khẩu'}
        </Button>

        {step === 'reset' && (
          <button
            type="button"
            onClick={requestOtp}
            disabled={isLoading || resendCooldown > 0}
            className="w-full min-h-11 text-sm text-blue-400 hover:text-blue-300 disabled:opacity-60"
            aria-live="polite"
          >
            {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : 'Gửi lại mã OTP'}
          </button>
        )}
      </form>

      <Link
        href="/login"
        className="mt-6 flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại trang đăng nhập
      </Link>
    </div>
  );
}
