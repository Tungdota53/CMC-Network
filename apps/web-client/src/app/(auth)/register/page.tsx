"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    identifier: '',
    password: '',
    confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu nhập lại không khớp!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          identifier: formData.identifier,
          password: formData.password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Có lỗi xảy ra khi đăng ký');
      } else {
        setSuccess('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.');
        setFormData({
          fullName: '',
          identifier: '',
          password: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Animated Background Blurs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] -z-10 mix-blend-screen animate-pulse duration-1000"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] -z-10 mix-blend-screen animate-pulse duration-[2000ms]"></div>
      
      {/* Registration Card (Glassmorphism) */}
      <div className="w-full max-w-[500px] glass-panel rounded-3xl p-8 relative shadow-[0_0_50px_rgba(139,92,246,0.15)] border border-white/10">
        
        {/* Logo/Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-3xl shadow-[0_0_20px_rgba(139,92,246,0.6)]">
            C
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 tracking-tight mb-2">
            Tham gia mạng lưới
          </h1>
          <p className="text-gray-400 text-[15px] font-medium">Kết nối với hàng nghìn sinh viên Đại học CMC</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[14px] font-medium text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-[14px] font-medium text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-[13px] font-bold mb-2 ml-1">Họ và tên</label>
            <input 
              type="text" 
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full glass-input px-4 py-3 rounded-xl text-[15px] transition-all"
              placeholder="Nguyễn Văn A" 
            />
          </div>

          <div>
            <label className="block text-gray-400 text-[13px] font-bold mb-2 ml-1">Tài khoản (Email hoặc Mã SV)</label>
            <input 
              type="text" 
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              required
              className="w-full glass-input px-4 py-3 rounded-xl text-[15px] transition-all"
              placeholder="Nhập MSSV (2310xxx) hoặc Email (@cmc.edu.vn)" 
            />
          </div>
          
          <div>
            <label className="block text-gray-400 text-[13px] font-bold mb-2 ml-1">Mật khẩu</label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full glass-input px-4 py-3 rounded-xl text-[15px] transition-all"
              placeholder="••••••••" 
            />
          </div>

          <div>
            <label className="block text-gray-400 text-[13px] font-bold mb-2 ml-1">Xác nhận mật khẩu</label>
            <input 
              type="password" 
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full glass-input px-4 py-3 rounded-xl text-[15px] transition-all"
              placeholder="••••••••" 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] flex justify-center items-center gap-2 text-[15px]"
          >
            {isLoading ? (
               <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
               'Tạo tài khoản ngay'
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-gray-500 text-xs font-medium uppercase tracking-widest">Hoặc</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        <div className="mt-2">
          <button 
            onClick={() => {
              // Chuyển hướng tới Backend Endpoint xử lý Microsoft OAuth2
              window.location.href = '/api/auth/microsoft';
            }}
            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all flex justify-center items-center gap-3 text-[15px]"
          >
            <svg width="24" height="24" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" className="bg-white rounded-sm p-1">
              <path fill="#f25022" d="M0 0h10v10H0z"/>
              <path fill="#7fba00" d="M11 0h10v10H11z"/>
              <path fill="#00a4ef" d="M0 11h10v10H0z"/>
              <path fill="#ffb900" d="M11 11h10v10H11z"/>
            </svg>
            Tiếp tục với Microsoft Sinh viên
          </button>
        </div>

        <div className="mt-8 text-center text-gray-400 text-[14px]">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-blue-400 font-bold hover:text-blue-300 transition-colors underline-offset-4 hover:underline">
            Đăng nhập
          </Link>
        </div>

      </div>
    </div>
  );
}
