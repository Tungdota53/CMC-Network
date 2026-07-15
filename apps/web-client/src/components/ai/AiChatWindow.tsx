'use client';

import React, { useRef, useState } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Globe2, Wand2 } from 'lucide-react';
import api from '@/lib/api';

type ChatMessage = {
  id: number;
  role: 'assistant' | 'user';
  content: string;
  sources?: string[];
  actions?: Array<{ label: string; href: string }>;
};

function unwrap<T>(payload: any): T {
  return payload?.data?.data ?? payload?.data ?? payload;
}

function stripReasoning(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*$/gi, '')
    .trimStart();
}

export const AiChatWindow = () => {
  const nextMessageId = useRef(2);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: 'assistant', content: 'Chào bạn! Mình là trợ lý AI của CMC Network. Mình có thể hỗ trợ học tập, tra cứu thông tin trường CMC, và đọc nguồn chính thức CMC khi cần.' }
  ]);
  const [input, setInput] = useState('');
  const [useWeb, setUseWeb] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const question = input.trim();
    setInput('');
    setIsSending(true);
    const userMessageId = nextMessageId.current++;
    const assistantId = nextMessageId.current++;
    setMessages((current) => [
      ...current,
      { id: userMessageId, role: 'user', content: question },
      { id: assistantId, role: 'assistant', content: '', sources: [], actions: [] },
    ]);

    try {
      const response = await fetch('/api/ai/ask/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({
          question,
          user_id: 'web-client',
          use_web: useWeb,
        }),
      });

      if (!response.ok || !response.body) throw new Error('Không mở được luồng AI.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          const dataLine = event.split('\n').find((line) => line.startsWith('data:'));
          if (!dataLine) continue;
          const payload = JSON.parse(dataLine.slice(5).trim());
          if (payload.type === 'meta') {
            setMessages((current) => current.map((m) => m.id === assistantId ? { ...m, sources: payload.sources || [], actions: payload.actions || [] } : m));
          }
          if (payload.type === 'delta') {
            setMessages((current) => current.map((m) => m.id === assistantId ? { ...m, content: stripReasoning(`${m.content}${payload.text || ''}`) } : m));
          }
        }
      }
    } catch (streamError) {
      try {
        const response = await api.post('/ai/ask', {
          question,
          user_id: 'web-client',
          use_web: useWeb,
        });
        const data = unwrap<{ answer?: string; sources?: string[]; actions?: Array<{ label: string; href: string }> }>(response);
        setMessages((current) => current.map((m) => m.id === assistantId ? {
          ...m,
          content: stripReasoning(data.answer || '') || 'AI chưa trả về nội dung.',
          sources: data.sources || [],
          actions: data.actions || [],
        } : m));
      } catch (error: any) {
        setMessages((current) => current.map((m) => m.id === assistantId ? {
          ...m,
          content: error?.message || 'Không kết nối được AI service. Kiểm tra ai-service và API gateway.',
        } : m));
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex-1 bg-card rounded-2xl border border-border flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-primary text-white' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}`}>
              {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={`max-w-[70%] rounded-2xl p-4 ${m.role === 'user' ? 'bg-primary text-white' : 'bg-hover text-foreground'}`}>
              <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/60 space-y-1">
                  <div className="text-xs font-bold opacity-70 flex items-center gap-1">
                    <Globe2 className="w-3 h-3" /> Nguồn đã đọc
                  </div>
                  {m.sources.map((source) => (
                    <a key={source} href={source} target="_blank" rel="noreferrer" className="block text-xs underline break-all opacity-80 hover:opacity-100">
                      {source}
                    </a>
                  ))}
                </div>
              )}
              {m.actions && m.actions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.actions.map((action) => (
                    <a key={`${m.id}-${action.href}`} href={action.href} target={action.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-bold text-foreground hover:bg-background">
                      <Wand2 className="w-3 h-3" /> {action.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div className="max-w-[70%] rounded-2xl p-4 bg-hover text-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang đọc dữ liệu CMC và suy luận...
            </div>
          </div>
        )}
      </div>
      <div className="p-4 bg-card border-t border-border">
        <button
          type="button"
          onClick={() => setUseWeb((value) => !value)}
          className={`mb-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${useWeb ? 'bg-primary/10 text-primary border-primary/20' : 'bg-hover text-foreground/60 border-border'}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {useWeb ? 'Đang bật đọc nguồn CMC' : 'Tắt đọc nguồn CMC'}
        </button>
        <div className="flex items-center gap-2 bg-background p-2 rounded-xl border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !isSending && handleSend()}
            placeholder="Hỏi về CMC, ngành học, học phí, lịch học, tài liệu..." 
            className="flex-1 bg-transparent border-none focus:outline-none px-2 text-[15px] text-foreground"
          />
          <button disabled={isSending || !input.trim()} onClick={handleSend} className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-50">
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
