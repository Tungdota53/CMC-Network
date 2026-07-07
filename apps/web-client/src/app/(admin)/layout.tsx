'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserProvider, useUser } from '../contexts/UserContext';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';

function AdminLayoutInner({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user || user.role !== 'ADMIN') {
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen w-full bg-[#0B0F19] flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] -z-10 mix-blend-screen animate-pulse duration-1000"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] -z-10 mix-blend-screen animate-pulse duration-[2000ms]"></div>
        
        <div className="flex flex-col items-center gap-6 glass-panel p-10 rounded-3xl shadow-[0_0_50px_rgba(139,92,246,0.15)] border border-white/10">
          <div className="relative flex justify-center items-center">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="w-10 h-10 border-4 border-purple-500/30 border-b-purple-500 rounded-full animate-spin absolute" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-bold tracking-widest uppercase text-sm">Xác thực hệ thống...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0B0F19] text-gray-200 font-sans relative overflow-hidden">
      {/* Animated Background Blurs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-10 pointer-events-none mix-blend-screen animate-pulse duration-[3000ms]"></div>
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] -z-10 pointer-events-none mix-blend-screen animate-pulse duration-[4000ms]"></div>

      <AdminSidebar />
      <div className="flex-1 ml-[280px] flex flex-col h-screen">
        <AdminHeader />
        <main className="flex-1 p-8 overflow-auto no-scrollbar">
          <div className="max-w-7xl mx-auto pb-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </UserProvider>
  );
}
