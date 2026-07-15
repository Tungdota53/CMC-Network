import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="w-full flex flex-col h-full">
      <div className="text-left mb-6">
        <h1 className="text-2xl font-semibold text-white mb-1 font-display">Chào mừng trở lại!</h1>
        <p className="text-sm text-slate-400">Đăng nhập bằng tài khoản sinh viên CMC</p>
      </div>
      <LoginForm />
    </div>
  );
}
