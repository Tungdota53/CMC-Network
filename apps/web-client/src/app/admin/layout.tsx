import React from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 ml-64 flex flex-col">
        {/* Top navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <h2 className="font-bold text-gray-800 text-lg">System Administration</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-500">Welcome, Super Admin</span>
            <div className="w-10 h-10 bg-indigo-600 rounded-full border-2 border-indigo-200" />
          </div>
        </header>
        {/* Main Content Area */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
