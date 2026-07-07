"use client";

import toast from 'react-hot-toast';

interface MessageInputProps {
  messageInput: string;
  setMessageInput: (val: string) => void;
  handleSend: () => void;
  handleSendThumbsUp: () => void;
}

export default function MessageInput({
  messageInput,
  setMessageInput,
  handleSend,
  handleSendThumbsUp,
}: MessageInputProps) {
  return (
    <div className="p-4 lg:p-5 bg-white/60 backdrop-blur-xl border-t border-white/50 z-20">
      <div className="flex items-center gap-3 max-w-full">
        <button onClick={() => toast('Tính năng gửi file đang được hoàn thiện! (Beta)')} className="w-10 h-10 shrink-0 rounded-full bg-white hover:bg-indigo-50 flex items-center justify-center text-indigo-600 transition-all shadow-sm border border-slate-100 hover:scale-105">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <button onClick={() => toast('Tính năng gửi ảnh đang được hoàn thiện! (Beta)')} className="w-10 h-10 shrink-0 rounded-full bg-white hover:bg-indigo-50 flex items-center justify-center text-indigo-600 transition-all shadow-sm border border-slate-100 hover:scale-105">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        </button>
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Nhắn tin..."
            value={messageInput}
            onChange={(event) => setMessageInput(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleSend()}
            className="w-full pl-5 pr-12 py-3.5 bg-white/80 rounded-2xl text-[15px] font-medium text-slate-800 placeholder-slate-400 outline-none border border-slate-200/50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-[inset_0_2px_5px_rgba(0,0,0,0.02)]"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-500 transition-colors">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </button>
        </div>
        {messageInput.trim() ? (
          <button onClick={handleSend} className="w-12 h-12 shrink-0 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 rounded-full flex items-center justify-center text-white transition-all shadow-[0_4px_15px_rgba(79,70,229,0.3)] hover:scale-105 hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)]">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" className="ml-1">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        ) : (
          <button onClick={handleSendThumbsUp} className="w-12 h-12 shrink-0 bg-white hover:bg-slate-50 rounded-full flex items-center justify-center text-2xl transition-all shadow-sm border border-slate-100 hover:scale-105">👍</button>
        )}
      </div>
    </div>
  );
}
