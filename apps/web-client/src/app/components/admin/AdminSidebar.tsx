'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const AdminSidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    )},
    { name: 'Users', path: '/admin/users', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    )},
    { name: 'Posts', path: '/admin/posts', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15M9 11l3 3L22 4" /></svg>
    )}
  ];

  return (
    <aside className="w-[280px] bg-white/[0.02] backdrop-blur-xl border-r border-white/10 flex flex-col h-screen fixed top-0 left-0 z-40 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
      <div className="h-20 flex items-center px-8 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-[0_0_15px_rgba(139,92,246,0.5)] group-hover:scale-105 transition-transform">
            C
          </div>
          <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">CMC NetWork</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-3">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path));
          return (
            <Link 
              key={item.name} 
              href={item.path}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${isActive ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white shadow-[inset_0_0_20px_rgba(139,92,246,0.2)] border border-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
            >
              <div className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'text-gray-500 group-hover:text-gray-300'}`}>
                {item.icon}
              </div>
              <span className={`font-medium tracking-wide ${isActive ? 'drop-shadow-md' : ''}`}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/10">
        <Link href="/" className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent transition-all duration-300 group">
          <svg className="w-5 h-5 text-gray-500 group-hover:text-red-400 group-hover:scale-110 transition-all duration-300 drop-shadow-[0_0_8px_rgba(248,113,113,0)] group-hover:drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          <span className="font-medium">Thoát Admin</span>
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
