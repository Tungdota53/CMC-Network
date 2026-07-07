"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const localToken = localStorage.getItem('auth_token');
    // Helper to get cookie value by name
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    
    const cookieToken = getCookie('auth_token');
    const token = cookieToken || localToken;

    const timeoutId = window.setTimeout(() => {
      if (!token) {
        router.replace('/login');
      } else {
        setIsAuthenticated(true);
      }
      setIsChecking(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [router]);

  if (isChecking || !isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#030014]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-blue-400 font-medium animate-pulse">Đang kiểm tra bảo mật...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
