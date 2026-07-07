"use client";
import Link from 'next/link';
import { useUser } from '../contexts/UserContext';

export default function SidebarProfile() {
  const { user, isLoading } = useUser();

  return (
    <Link href="/profile/me" className="flex items-center gap-3 p-2 -mx-2 hover:bg-slate-100/80 rounded-xl cursor-pointer transition-colors group">
      <div className="relative">
        <img src={user?.avatarUrl || "https://i.pravatar.cc/150?img=11"} className="w-10 h-10 rounded-full object-cover group-hover:scale-105 transition-transform ring-2 ring-transparent group-hover:ring-indigo-500/30" />
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
      </div>
      <div className="flex flex-col overflow-hidden">
        <span className="font-semibold text-slate-800 group-hover:text-slate-900 truncate text-sm">{user?.fullName || 'Khách'}</span>
        {user?.studentId && (
          <span className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{user?.major || 'Sinh viên'} • {user?.cohort || ''}</span>
        )}
      </div>
    </Link>
  );
}
