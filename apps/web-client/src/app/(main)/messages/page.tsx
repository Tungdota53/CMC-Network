'use client';

import React from 'react';
import { Edit, MessageCircle, ShieldCheck, Zap } from 'lucide-react';

export default function MessagesEmptyState() {
  return (
    <main className="flex h-full w-full items-center justify-center overflow-y-auto px-6 py-10">
      <div className="w-full max-w-lg text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
        <MessageCircle className="h-10 w-10 text-primary" />
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">CMC Messages</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Kết nối liền mạch trong campus</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        Chọn cuộc trò chuyện bên trái để tiếp tục, hoặc tạo nhóm mới để học tập và trao đổi cùng bạn bè.
      </p>
      <div className="mt-8 grid grid-cols-3 gap-2 text-left">
        {[{ Icon: Zap, label: 'Tin nhắn thời gian thực' }, { Icon: ShieldCheck, label: 'Không gian riêng tư' }, { Icon: Edit, label: 'Nhóm học nhanh' }].map(({ Icon, label }) => <div key={label} className="rounded-xl border border-border bg-card/70 p-3"><Icon className="h-5 w-5 text-primary" /><p className="mt-2 text-xs font-semibold leading-5 text-foreground">{label}</p></div>)}
      </div>
      </div>
    </main>
  );
}
