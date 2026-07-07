"use client";

import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const suggestions = [
  { icon: '📝', label: 'Tóm tắt tài liệu' },
  { icon: '💡', label: 'Giải bài tập Code' },
  { icon: '📅', label: 'Lên lịch học tập' },
  { icon: '🔍', label: 'Tìm nhóm học cùng' },
];

export default function AIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      text: 'Chào bạn! Mình là AI Assistant của CMC NetWork. Mình có thể giúp bạn giải bài tập, tóm tắt tài liệu, hoặc sắp xếp lịch học. Bạn cần hỗ trợ gì nào?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    const newUserMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });
      const data = await res.json();
      const newAiMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: data.reply || 'AI không trả về nội dung.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, newAiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: 'AI đang lỗi kết nối. Vui lòng thử lại sau.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-120px)] flex flex-col glass rounded-3xl overflow-hidden relative shadow-[0_0_30px_rgba(139,92,246,0.15)]">
      
      {/* HEADER */}
      <div className="glass-panel px-6 py-4 flex items-center justify-between z-10 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            <div className="w-full h-full bg-[#0f172a] rounded-full flex items-center justify-center text-xl">
              🤖
            </div>
          </div>
          <div>
            <h2 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 text-lg">
              CMC NetWork AI
            </h2>
            <div className="flex items-center gap-1.5 text-[13px] text-green-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
              Sẵn sàng hỗ trợ
            </div>
          </div>
        </div>
        <div className="flex gap-2">
           <button className="w-10 h-10 glass rounded-full flex items-center justify-center text-gray-300 hover:text-white transition-colors">🧹</button>
           <button className="w-10 h-10 glass rounded-full flex items-center justify-center text-gray-300 hover:text-white transition-colors">⚙️</button>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar relative z-0">
        
        {/* BG Blurs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -z-10"></div>

        {/* Welcome Suggestions */}
        {messages.length === 1 && (
          <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto mt-4 mb-8">
            {suggestions.map((item, idx) => (
              <div 
                key={idx}
                onClick={() => setInputText(item.label)}
                className="glass p-4 rounded-2xl cursor-pointer hover:bg-white/10 hover:scale-[1.02] transition-all border border-white/5 text-center group"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{item.icon}</div>
                <div className="text-sm font-semibold text-gray-300 group-hover:text-white">{item.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
            <div className={`flex gap-3 max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm shadow-md border border-white/10">
                {msg.role === 'user' ? (
                  <img src="https://i.pravatar.cc/150?img=11" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">🤖</div>
                )}
              </div>

              {/* Message Bubble */}
              <div className="flex flex-col gap-1 min-w-[120px]">
                <div className={`p-4 rounded-2xl text-[15px] leading-relaxed shadow-lg backdrop-blur-md ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-tr-sm border border-blue-400/30' 
                    : 'bg-white/5 text-gray-200 rounded-tl-sm border border-white/10'
                }`}>
                  {msg.text}
                </div>
                <span className={`text-[11px] text-gray-500 font-medium px-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                  msg.role === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
           <div className="flex justify-start">
             <div className="flex gap-3 max-w-[75%]">
               <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-sm border border-white/10 shadow-md">🤖</div>
               <div className="p-4 rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 backdrop-blur-md flex gap-1.5 items-center">
                 <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                 <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                 <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
               </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="glass-panel p-4 z-10 border-t border-white/10">
        <div className="glass-input rounded-full p-1.5 pl-5 pr-2 flex items-center gap-3 relative shadow-inner">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Hỏi AI bất cứ điều gì..."
            className="flex-1 bg-transparent border-none outline-none text-gray-200 placeholder-gray-500 text-[15px]"
          />
          <button 
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              inputText.trim() && !isTyping
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.6)] hover:scale-105' 
                : 'bg-white/5 text-gray-500'
            }`}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
          </button>
        </div>
        <div className="text-center mt-2 text-[11px] text-gray-500 font-medium">
          AI có thể mắc lỗi. Vui lòng kiểm tra lại thông tin quan trọng.
        </div>
      </div>
    </div>
  );
}
