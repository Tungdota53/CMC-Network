"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const hasHandledOAuth = useRef(false);

  useEffect(() => {
    if (hasHandledOAuth.current) return;
    hasHandledOAuth.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userStr = params.get('user');

    if (token) {
      localStorage.setItem('auth_token', token);
      document.cookie = `auth_token=${token}; path=/; max-age=604800`;
      if (userStr) {
        localStorage.setItem('user_info', userStr);
      }
      router.replace('/');
    }
  }, [router]);

  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Sai thông tin đăng nhập');
      } else {
        if (data.requires2FA) {
           setError('Tài khoản yêu cầu xác thực 2 bước (2FA). Tính năng 2FA đang được hoàn thiện trên giao diện.');
           // Save data.temp2faToken somewhere if needed later when 2FA UI is added
           return;
        }

        const token = data.access_token || data.token;
        if (!token) {
          setError('Máy chủ không trả về phiên đăng nhập hợp lệ.');
          return;
        }
        setSuccess('Đăng nhập thành công!');
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_info', JSON.stringify(data.user));
        document.cookie = `auth_token=${token}; path=/; max-age=604800`;

        // Redirect to homepage after short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 800);
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
      <div className="absolute top-20 right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] -z-10 mix-blend-screen animate-pulse duration-1000"></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] -z-10 mix-blend-screen animate-pulse duration-[2000ms]"></div>
      
      {/* Login Card (Glassmorphism) */}
      <div className="w-full max-w-[420px] glass-panel rounded-3xl p-8 relative shadow-[0_0_50px_rgba(139,92,246,0.15)] border border-white/10">
        
        {/* Logo/Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-3xl shadow-[0_0_20px_rgba(139,92,246,0.6)]">
            C
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 tracking-tight mb-2">
            Chào mừng trở lại
          </h1>
          <p className="text-gray-400 text-[15px] font-medium">Đăng nhập để tiếp tục kết nối</p>
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

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-[13px] font-bold mb-2 ml-1">Tài khoản (Email hoặc Mã SV)</label>
            <input 
              type="text" 
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              required
              autoComplete="username"
              className="w-full glass-input px-4 py-3 rounded-xl text-[15px] transition-all"
              placeholder="Nhập MSSV (2310xxx) hoặc Email" 
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2 ml-1">
              <label className="text-gray-400 text-[13px] font-bold">Mật khẩu</label>
              <Link href="#" className="text-[12px] text-blue-400 font-medium hover:text-blue-300 transition-colors">Quên mật khẩu?</Link>
            </div>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
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
               'Đăng nhập'
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-gray-500 text-xs font-medium uppercase tracking-widest">Hoặc</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        <button 
          onClick={() => {
            // Chuyển hướng tới Backend Endpoint xử lý Microsoft OAuth2
            window.location.href = '/api/auth/microsoft';
          }}
          className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all flex justify-center items-center gap-3 text-[15px]"
        >
          <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
            <path fill="#f25022" d="M0 0h10v10H0z"/>
            <path fill="#7fba00" d="M11 0h10v10H11z"/>
            <path fill="#00a4ef" d="M0 11h10v10H0z"/>
            <path fill="#ffb900" d="M11 11h10v10H11z"/>
          </svg>
          Đăng nhập bằng Microsoft Sinh viên
        </button>

        <div className="mt-8 text-center text-gray-400 text-[14px]">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-blue-400 font-bold hover:text-blue-300 transition-colors underline-offset-4 hover:underline">
            Tạo tài khoản mới
          </Link>
        </div>

      </div>
    </div>
  );
}
