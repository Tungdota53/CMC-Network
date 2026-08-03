'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useState, useMemo } from 'react';
import { Select } from '@/components/ui/Select';
import api from '@/lib/api';
import { Calendar, CheckCircle2, Eye, EyeOff, Info, KeyRound, Lock, Mail, User, Users, XCircle } from 'lucide-react';
import Link from 'next/link';

const getErrorMessage = (err: any, fallback: string) => {
  const raw = err?.error?.message || err?.response?.data?.error?.message || err?.message;
  return Array.isArray(raw) ? raw.join('; ') : String(raw || fallback);
};

const ALLOWED_STUDENT_EMAIL_DOMAINS = ['st.cmcu.edu.vn', 'st.cmc.edu.vn', 'cmc.edu.vn'];
const authInputClass = 'auth-input relative z-10 h-12 border-white/20 !bg-slate-950/35 text-white caret-blue-300 shadow-inner placeholder:text-slate-400 hover:!bg-slate-950/35 focus:border-blue-300/70 focus:!bg-slate-950/55 focus:ring-blue-400/40';
const authInputWithActionClass = `${authInputClass} pr-12`;

function getAllowedEmailDomain(email: string) {
  const normalized = email.trim().toLowerCase();
  const parts = normalized.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return ALLOWED_STUDENT_EMAIL_DOMAINS.includes(parts[1]) ? parts[1] : null;
}

export function RegisterForm() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Email/Pass, 2: Name, 3: DOB/Gender, 4: Verify
  const [globalError, setGlobalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    lastName: '',
    firstName: '',
    day: '1',
    month: '1',
    year: '2005',
    gender: 'MALE',
  });

  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  const passwordChecks = useMemo(() => [
    { label: 'Ít nhất 8 ký tự', valid: formData.password.length >= 8 },
    { label: 'Có chữ cái', valid: /[A-Za-zÀ-ỹ]/.test(formData.password) },
    { label: 'Có số', valid: /\d/.test(formData.password) },
    { label: 'Nhập lại khớp', valid: Boolean(formData.confirmPassword) && formData.password === formData.confirmPassword },
  ], [formData.confirmPassword, formData.password]);

  const updateFormData = (patch: Partial<typeof formData>) => {
    setFormData((current) => ({ ...current, ...patch }));
    setGlobalError('');
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = window.setInterval(() => {
      setResendCooldown((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  // Select Options
  const dayOptions = useMemo(() => Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: String(i + 1) })), []);
  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ label: `Tháng ${i + 1}`, value: String(i + 1) })), []);
  const yearOptions = useMemo(() => Array.from({ length: 50 }, (_, i) => {
    const year = new Date().getFullYear() - 16 - i;
    return { label: String(year), value: String(year) };
  }), []);
  const genderOptions = useMemo(() => [
    { label: 'Nam', value: 'MALE' },
    { label: 'Nữ', value: 'FEMALE' },
    { label: 'Khác', value: 'OTHER' }
  ], []);

  const handleNextStep1 = () => {
    setGlobalError('');
    if (!getAllowedEmailDomain(formData.email)) {
      return setGlobalError('Vui lòng sử dụng email trường CMC (@st.cmcu.edu.vn, @st.cmc.edu.vn hoặc @cmc.edu.vn)');
    }
    if (!passwordChecks.every((check) => check.valid)) {
      return setGlobalError('Vui lòng hoàn tất điều kiện mật khẩu trước khi tiếp tục.');
    }
    if (formData.password !== formData.confirmPassword) {
      return setGlobalError('Mật khẩu xác nhận không khớp');
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    setGlobalError('');
    if (!formData.lastName.trim() || !formData.firstName.trim()) {
      return setGlobalError('Vui lòng nhập đầy đủ Họ và Tên');
    }
    setStep(3);
  };

  const onSubmitRegister = async () => {
    setGlobalError('');
    if (!acceptedLegal) {
      setGlobalError('Bạn cần đồng ý với Điều khoản sử dụng, Chính sách bảo mật và Khai báo dữ liệu.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/auth/register', {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        fullName: `${formData.lastName.trim()} ${formData.firstName.trim()}`,
      });
      setStep(4);
      startResendCooldown();
    } catch (err: any) {
      setGlobalError(getErrorMessage(err, 'Đăng ký thất bại. Vui lòng thử lại sau.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onVerify = async () => {
    if (otp.length !== 6) {
      setGlobalError('Vui lòng nhập đủ 6 chữ số');
      return;
    }
    setGlobalError('');
    setIsVerifying(true);
    try {
      await api.post('/auth/verify-email', {
        email: formData.email,
        otp,
      });
      setSuccessMessage('Xác thực thành công! Đang chuyển hướng...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err: any) {
      setGlobalError(getErrorMessage(err, 'Mã OTP không chính xác.'));
    } finally {
      setIsVerifying(false);
    }
  };

  const onResendOtp = async () => {
    if (resendCooldown > 0) {
      setGlobalError(`Vui lòng chờ ${resendCooldown} giây trước khi gửi lại mã.`);
      return;
    }
    setGlobalError('');
    setIsResending(true);
    try {
      await api.post('/auth/resend-otp', { email: formData.email });
      setSuccessMessage('Mã OTP mới đã được gửi!');
      startResendCooldown();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setGlobalError(getErrorMessage(err, 'Không thể gửi lại mã.'));
    } finally {
      setIsResending(false);
    }
  };

  // ======================== RENDER ========================
  
  if (step === 4) {
    return (
      <div className="space-y-5">
        <div className="text-center mb-4">
          <p className="text-slate-400 text-sm">
            Chúng tôi đã gửi mã xác thực đến
          </p>
          <p className="font-semibold text-blue-400 mt-1">{formData.email}</p>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-left text-sm text-amber-100">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
          <p>
            Không thấy mã OTP? Email có thể bị chuyển vào mục Thư rác, Spam,
            Junk hoặc Other. Vui lòng kiểm tra các mục đó trước khi gửi lại mã.
          </p>
        </div>

        {globalError && (
          <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400 text-center border border-red-500/20 font-medium">
            {globalError}
          </div>
        )}
        {successMessage && (
          <div className="rounded-xl bg-green-500/10 p-4 text-sm text-green-400 text-center border border-green-500/20 font-medium">
            {successMessage}
          </div>
        )}

        <div className="space-y-2 text-left">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-1 pl-1">
            Mã OTP (6 số) <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="Nhập mã 6 chữ số"
            icon={<KeyRound className="w-5 h-5 text-slate-400" />}
            value={otp}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setOtp(val);
              setGlobalError('');
            }}
            className={`h-14 border-white/20 bg-slate-950/35 text-center font-mono text-xl text-white caret-blue-300 shadow-inner placeholder:text-slate-400 focus:border-blue-300/70 focus:bg-slate-950/55 focus:ring-blue-400/40 ${otp.length > 0 ? 'tracking-[0.3em]' : 'tracking-normal'}`}
            maxLength={6}
          />
        </div>

        <Button
          type="button"
          onClick={onVerify}
          className="sticky bottom-[calc(env(safe-area-inset-bottom)+8px)] z-10 mt-4 h-12 w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-blue-600 to-indigo-600 text-[15px] font-bold text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] transition-all hover:from-blue-500 hover:to-indigo-500 sm:static"
          isLoading={isVerifying}
        >
          <span className="relative z-10">Xác thực</span>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
        </Button>

        <div className="text-center text-sm pt-2">
          <button
            type="button"
            onClick={onResendOtp}
            disabled={isResending || resendCooldown > 0}
            className="text-slate-400 hover:text-blue-400 transition-colors font-medium disabled:opacity-50"
          >
            {isResending
              ? 'Đang gửi...'
              : resendCooldown > 0
                ? `Gửi lại sau ${resendCooldown}s`
                : 'Gửi lại mã OTP'}
          </button>
        </div>

        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-medium">hoặc</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <div className="text-center">
          <Button
            type="button"
            onClick={() => { setStep(1); setGlobalError(''); }}
            className="w-full bg-white/5 hover:bg-white/10 text-slate-200 font-semibold border border-white/10 rounded-xl h-12 text-[15px] transition-all"
          >
            Sửa thông tin đăng ký
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3" aria-label="Tiến độ đăng ký">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-300">
          <span>Bước {step}/3</span>
          <span>{step === 1 ? 'Tài khoản' : step === 2 ? 'Hồ sơ' : 'Thông tin thêm'}</span>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </div>

      {globalError && (
        <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400 text-center border border-red-500/20 font-medium">
          {globalError}
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <>
          <div className="space-y-2 text-left">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-1 pl-1">
              Email sinh viên <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              autoComplete="email"
              placeholder="Email CMC (@st.cmcu.edu.vn, @st.cmc.edu.vn)"
              icon={<Mail className="w-5 h-5 text-slate-400" />}
              value={formData.email}
              onChange={(e) => updateFormData({ email: e.target.value })}
              className={authInputClass}
            />
          </div>

          <div className="space-y-2 text-left">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-1 pl-1">
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Mật khẩu (ít nhất 8 ký tự)"
                icon={<Lock className="w-5 h-5 text-slate-400" />}
                value={formData.password}
                onChange={(e) => updateFormData({ password: e.target.value })}
                className={authInputWithActionClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-1 pl-1">
              Xác nhận lại mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu"
                icon={<KeyRound className="w-5 h-5 text-slate-400" />}
                value={formData.confirmPassword}
                onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
                className={authInputWithActionClass}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu nhập lại' : 'Hiện mật khẩu nhập lại'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <ul className="grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300 sm:grid-cols-2" aria-label="Điều kiện mật khẩu">
            {passwordChecks.map((check) => (
              <li key={check.label} className="flex items-center gap-2">
                {check.valid ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-slate-500" />}
                <span className={check.valid ? 'text-emerald-200' : undefined}>{check.label}</span>
              </li>
            ))}
          </ul>

          <Button
            type="button"
            onClick={handleNextStep1}
            className="sticky bottom-[calc(env(safe-area-inset-bottom)+8px)] z-10 mt-4 h-12 w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-blue-600 to-indigo-600 text-[15px] font-bold text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] transition-all hover:from-blue-500 hover:to-indigo-500 sm:static"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Tiếp theo
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
          </Button>
        </>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 text-left">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-1 pl-1">
                Họ <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="VD: Nguyễn Văn"
                icon={<User className="w-5 h-5 text-slate-400" />}
                value={formData.lastName}
                onChange={(e) => updateFormData({ lastName: e.target.value })}
                className={authInputClass}
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-1 pl-1">
                Tên <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="VD: A"
                value={formData.firstName}
                onChange={(e) => updateFormData({ firstName: e.target.value })}
                className={authInputClass}
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={handleNextStep2}
            className="sticky bottom-[calc(env(safe-area-inset-bottom)+8px)] z-10 mt-4 h-12 w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-blue-600 to-indigo-600 text-[15px] font-bold text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] transition-all hover:from-blue-500 hover:to-indigo-500 sm:static"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Tiếp theo
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
          </Button>
          
          <div className="text-center mt-2">
            <button type="button" onClick={() => setStep(1)} className="text-sm text-slate-400 hover:text-white transition-colors">
              ← Quay lại bước trước
            </button>
          </div>
        </>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <>
          <div className="space-y-2 text-left">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-1 pl-1">
              Ngày sinh <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Select
                  options={dayOptions}
                  value={formData.day}
                  onChange={(val) => updateFormData({ day: val })}
                  icon={<Calendar className="w-4 h-4" />}
                />
              </div>
              <div>
                <Select
                  options={monthOptions}
                  value={formData.month}
                  onChange={(val) => updateFormData({ month: val })}
                />
              </div>
              <div>
                <Select
                  options={yearOptions}
                  value={formData.year}
                  onChange={(val) => updateFormData({ year: val })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-1 pl-1 mt-2">
              Giới tính <span className="text-red-500">*</span>
            </label>
            <div className="w-full mt-1">
              <Select
                options={genderOptions}
                value={formData.gender}
                onChange={(val) => updateFormData({ gender: val })}
                icon={<Users className="w-4 h-4" />}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
            <div className="flex items-start gap-3">
              <input
                id="accepted-legal"
                type="checkbox"
                checked={acceptedLegal}
                onChange={(event) => {
                  setAcceptedLegal(event.target.checked);
                  setGlobalError('');
                }}
                className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-white/30 accent-blue-500"
              />
              <label htmlFor="accepted-legal" className="cursor-pointer text-sm leading-6 text-slate-300">
                Tôi đã đọc và đồng ý với{' '}
                <Link href="/terms" target="_blank" className="font-semibold text-blue-300 underline underline-offset-2 hover:text-blue-200">Điều khoản sử dụng</Link>,{' '}
                <Link href="/privacy" target="_blank" className="font-semibold text-blue-300 underline underline-offset-2 hover:text-blue-200">Chính sách bảo mật</Link>{' '}
                và{' '}
                <Link href="/data-declaration" target="_blank" className="font-semibold text-blue-300 underline underline-offset-2 hover:text-blue-200">Khai báo dữ liệu</Link>.
              </label>
            </div>
          </div>

          <Button
            type="button"
            onClick={onSubmitRegister}
            disabled={!acceptedLegal || isSubmitting}
            className="sticky bottom-[calc(env(safe-area-inset-bottom)+8px)] z-10 mt-6 h-12 w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-blue-600 to-indigo-600 text-[15px] font-bold text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] transition-all hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:static"
            isLoading={isSubmitting}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Tạo tài khoản
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
          </Button>

          <div className="text-center mt-2">
            <button type="button" onClick={() => setStep(2)} className="text-sm text-slate-400 hover:text-white transition-colors">
              ← Quay lại bước trước
            </button>
          </div>
        </>
      )}
    </div>
  );
}
