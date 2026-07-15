'use client';

import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CMCLogo } from '@/components/CMCLogo';
import api from '@/lib/api';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';
  const isRegister = pathname === '/register';

  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto');
  const contentRef = useRef<HTMLDivElement>(null);

  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    // TODO (AI_2): Cần API GET /users/count (public) trả về tổng số user thật. 
    // Tạm thời gọi, nếu lỗi (404) sẽ có fallback
    const fetchUserCount = async () => {
      try {
        const res = await api.get('/users/count');
        if (res.data?.data?.count) {
          setUserCount(res.data.data.count);
        } else if (res.data?.count) {
          setUserCount(res.data.count);
        } else {
          setUserCount(2048); // Fallback
        }
      } catch (e) {
        console.warn("API /users/count chưa sẵn sàng", e);
        setUserCount(2048); // Fallback
      }
    };
    fetchUserCount();
  }, []);

  // Concurrent transition states
  const [pages, setPages] = useState<Array<{ path: string; node: React.ReactNode; dir: 'left' | 'right' | 'none' }>>([
    { path: pathname, node: children, dir: 'none' }
  ]);

  useEffect(() => {
    setPages((prev) => {
      // If the path hasn't changed, just update the node (for HMR or nested state changes)
      if (prev[prev.length - 1].path === pathname) {
        const updated = [...prev];
        updated[updated.length - 1].node = children;
        return updated;
      }
      
      const currentPath = prev[prev.length - 1].path;
      const currentOrder = currentPath === '/login' ? 0 : currentPath === '/register' ? 1 : 2;
      const nextOrder = pathname === '/login' ? 0 : pathname === '/register' ? 1 : 2;
      const dir: 'left' | 'right' = nextOrder < currentOrder ? 'right' : 'left'; // Right means old slides right, new slides in from left
      
      return [...prev, { path: pathname, node: children, dir }].slice(-2);
    });
  }, [pathname, children]);

  // Handle height animation measurement
  useEffect(() => {
    if (!contentRef.current) return;
    
    setContentHeight(contentRef.current.offsetHeight);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContentHeight(entry.target.getBoundingClientRect().height);
      }
    });

    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [pages]); // Re-trigger when pages array changes

  return (
    <div className="text-slate-200 overflow-x-hidden overflow-y-auto relative flex min-h-dvh items-start justify-center font-sans px-4 py-6 sm:px-6 md:min-h-screen md:pt-[15vh]" style={{
      backgroundColor: '#0f172a',
      backgroundImage: `
        radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), 
        radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), 
        radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)
      `,
      backgroundAttachment: 'fixed'
    }}>
      {/* Animated Orbs Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600 rounded-full mix-blend-multiply blur-[100px] opacity-60 animate-[blob_7s_infinite]"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-600 rounded-full mix-blend-multiply blur-[100px] opacity-60 animate-[blob_7s_infinite_2s]"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-blue-600 rounded-full mix-blend-multiply blur-[120px] opacity-50 animate-[blob_7s_infinite_4s]"></div>
      </div>

      {/* Main Container - Changed to items-start to prevent vertical shifting when height changes */}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-start justify-center gap-6 pb-[calc(env(safe-area-inset-bottom)+24px)] md:flex-row md:gap-12 md:p-6">
        
        {/* Branding Section (Left) */}
        <div className="hidden md:flex flex-col w-1/2 pr-8 animate-[float_6s_ease-in-out_infinite] mt-4">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] p-8 rounded-3xl">
            <div className="flex items-center gap-4 mb-6">
              <img src="/new-logo-transparent.png" alt="CMC Network Logo" className="h-14 w-auto object-contain drop-shadow-xl" />
              <h1 className="flex items-baseline gap-2 font-display select-none">
                <span className="font-black text-5xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-blue-200">
                  CMC
                </span>
                <span className="font-light text-xl tracking-[0.2em] text-white/70 uppercase">
                  Network
                </span>
              </h1>
            </div>
            <h2 className="text-4xl font-semibold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-slate-400 mb-4 font-display">
              Kết nối không giới hạn,<br/>Trải nghiệm đa không gian.
            </h2>
            <p className="text-slate-300/80 text-lg mb-8 leading-relaxed">
              Nền tảng sinh viên hiện đại nhất. Quản lý học tập, kết nối bạn bè và khám phá những sự kiện thú vị ngay trong khuôn viên trường.
            </p>
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
              </div>
              <div className="text-sm text-slate-400 flex flex-col justify-center">
                <span className="font-semibold text-white text-base">
                  {userCount !== null ? `${userCount.toLocaleString()} sinh viên` : 'Đang cập nhật...'}
                </span>
                đang hoạt động trên nền tảng
              </div>
            </div>
          </div>
        </div>

        {/* Auth Form Section (Right) */}
        <div className="w-full max-w-md md:w-5/12">
          {/* Tabs */}
          <div className="flex justify-center mb-6">
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] p-1 rounded-2xl flex gap-1 w-full relative">
              {(isLogin || isRegister) && (
                <div
                  className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] bg-white/10 rounded-xl shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isLogin ? 'left-1 translate-x-0' : 'left-1 translate-x-full'}`}
                ></div>
              )}
              <Link href="/login" className={`flex-1 py-3 px-4 rounded-xl text-sm relative z-10 transition-colors text-center ${isLogin ? 'font-semibold text-white' : 'font-medium text-slate-400 hover:text-white'}`}>
                Đăng nhập
              </Link>
              <Link href="/register" className={`flex-1 py-3 px-4 rounded-xl text-sm relative z-10 transition-colors text-center ${isRegister ? 'font-semibold text-white' : 'font-medium text-slate-400 hover:text-white'}`}>
                Đăng ký
              </Link>
            </div>
          </div>

          {/* Form Card with Smooth Height Animation */}
          <div 
            className="bg-white/5 backdrop-blur-[16px] border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-3xl relative overflow-hidden group transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ height: contentHeight === 'auto' ? 'auto' : `${contentHeight}px` }}
          >
            {/* Inner glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-blue-500/20 blur-[50px] pointer-events-none rounded-full"></div>
            
            {/* Concurrent Transition Wrapper */}
            <div ref={contentRef} className="relative z-10 w-full h-max">
              {pages.map((page, index) => {
                const isCurrent = index === pages.length - 1;
                const isLeaving = index === pages.length - 2;
                
                let animationClass = '';
                if (isCurrent && pages.length > 1) {
                   // Entering page: premium spring ease, 500ms
                   animationClass = page.dir === 'right' 
                     ? 'animate-[slideInLeft_500ms_cubic-bezier(0.22,1,0.36,1)_forwards] relative z-20' 
                     : 'animate-[slideInRight_500ms_cubic-bezier(0.22,1,0.36,1)_forwards] relative z-20';
                } else if (isLeaving) {
                   // Leaving page: slightly faster exit (300ms) with ease-in
                   const newPageDir = pages[pages.length - 1].dir;
                   animationClass = newPageDir === 'right'
                     ? 'animate-[slideOutRight_300ms_cubic-bezier(0.32,0,0.67,0)_forwards] absolute top-0 left-0 w-full z-10'
                     : 'animate-[slideOutLeft_300ms_cubic-bezier(0.32,0,0.67,0)_forwards] absolute top-0 left-0 w-full z-10';
                } else if (isCurrent) {
                   animationClass = 'relative z-20'; // First load, no animation
                }

                return (
                  <div 
                    key={page.path} 
                    className={`flex h-max w-full flex-col p-5 sm:p-8 ${animationClass}`}
                    onAnimationEnd={() => {
                      if (isLeaving) {
                        setPages(p => p.filter(x => x.path !== page.path));
                      }
                    }}
                  >
                    {page.node}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes slideOutLeft {
          from { opacity: 1; transform: translateX(0) scale(1); filter: blur(0px); }
          to { opacity: 0; transform: translateX(-30px) scale(0.95); filter: blur(4px); }
        }
        @keyframes slideOutRight {
          from { opacity: 1; transform: translateX(0) scale(1); filter: blur(0px); }
          to { opacity: 0; transform: translateX(30px) scale(0.95); filter: blur(4px); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px) scale(0.95); filter: blur(4px); }
          to { opacity: 1; transform: translateX(0) scale(1); filter: blur(0px); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px) scale(0.95); filter: blur(4px); }
          to { opacity: 1; transform: translateX(0) scale(1); filter: blur(0px); }
        }
      `}} />
    </div>
  );
}
