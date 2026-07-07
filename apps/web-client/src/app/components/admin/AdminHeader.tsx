'use client';

const AdminHeader = () => {
  return (
    <header className="h-20 bg-white/[0.02] backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-10 sticky top-0 z-30 w-full shadow-sm">
      <div className="flex items-center">
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 tracking-tight">Admin Portal</h1>
      </div>
      
      <div className="flex items-center gap-8">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Search everything..." 
            className="bg-black/20 border border-white/10 text-gray-200 text-sm rounded-full px-5 py-2.5 w-[300px] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 placeholder-gray-500 group-hover:border-white/20"
          />
          <svg className="w-4 h-4 text-gray-400 absolute right-4 top-3 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <button className="text-gray-400 hover:text-white transition-all duration-300 relative hover:scale-110">
          <svg className="w-6 h-6 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-4 ring-[#0B0F19] shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
        </button>

        <div className="flex items-center gap-4 pl-8 border-l border-white/10">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-white tracking-wide flex items-center justify-end gap-1.5">
              Quản Trị Viên
              <svg className="w-4 h-4 text-blue-500 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.5 12l-1.92-2.15.42-2.83-2.79-.65-1.39-2.52-2.82.68L12 2.5 9.9 4.53 7.08 3.85 5.69 6.37l-2.79.65.42 2.83L1.5 12l1.92 2.15-.42 2.83 2.79.65 1.39 2.52 2.82-.68L12 21.5l2.1-2.03 2.82.68 1.39-2.52 2.79-.65-.42-2.83L22.5 12zm-11 4.5l-4-4 1.41-1.41L11.5 13.67l6.59-6.59L19.5 8.5l-8 8z" />
              </svg>
            </p>
            <p className="text-xs text-purple-400 font-medium">System Admin</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black border-2 border-white/20 shadow-[0_0_15px_rgba(139,92,246,0.4)] cursor-pointer hover:scale-105 transition-transform">
            A
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
