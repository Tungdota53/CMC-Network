import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="w-full flex flex-col h-full">
      <div className="text-left mb-6">
        <h1 className="text-2xl font-semibold text-white mb-1 font-display">Tạo tài khoản mới</h1>
        <p className="text-sm text-slate-400">Trở thành một phần của CMC Campus</p>
      </div>
      <RegisterForm />
    </div>
  );
}
