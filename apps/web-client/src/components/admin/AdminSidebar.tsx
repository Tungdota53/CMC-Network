import React from 'react';
import Link from 'next/link';
import { Home, Users, MessageSquare, FileText, Calendar, ShoppingCart, Flag, Settings, ShieldAlert, LogOut } from 'lucide-react';

const MENU_ITEMS = [
  { icon: Home, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: MessageSquare, label: 'Posts', href: '/admin/posts' },
  { icon: FileText, label: 'Materials', href: '/admin/materials' },
  { icon: Calendar, label: 'Events', href: '/admin/events' },
  { icon: ShoppingCart, label: 'Products', href: '/admin/products' },
  { icon: Flag, label: 'Reports', href: '/admin/reports' },
  { icon: ShieldAlert, label: 'Email Domains', href: '/admin/email-domains' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

export const AdminSidebar = () => {
  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col shadow-2xl fixed left-0 top-0">
      <div className="p-6 border-b border-gray-800">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-black text-white">
            A
          </div>
          <span className="font-bold text-lg tracking-tight">Admin Console</span>
        </Link>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1">
        {MENU_ITEMS.map((item) => (
          <Link key={item.label} href={item.href} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 transition-colors font-medium text-sm">
            <item.icon className="w-5 h-5 opacity-70" />
            {item.label}
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-gray-800">
        <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors font-medium text-sm">
          <LogOut className="w-5 h-5 opacity-70" />
          Exit Admin
        </Link>
      </div>
    </div>
  );
};
