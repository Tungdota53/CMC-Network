"use client";

import { useState } from 'react';
import { Bot, X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AITutorWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'ai'; content: string }[]>([
    { id: 'welcome', role: 'ai', content: 'Chào bạn! Mình là AI Tutor. Mình có thể giúp gì cho việc học của bạn hôm nay?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const userInfo = localStorage.getItem('user_info');
      const userId = userInfo ? JSON.parse(userInfo).id : 'anonymous';

      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage, user_id: userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: data.answer }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: 'Xin lỗi, đã xảy ra lỗi kết nối.' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: 'Xin lỗi, không thể kết nối tới AI Tutor lúc này.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ y: -4, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-20 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-xl z-40 flex items-center gap-2"
          >
            <Bot size={24} />
            <span className="font-semibold hidden md:inline">AI Tutor</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-4 right-20 w-80 sm:w-96 h-[500px] max-h-[80vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Bot size={20} />
                <h3 className="font-bold">CampusConnect AI Tutor</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <motion.div 
                    initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`max-w-[80%] rounded-2xl p-3 ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-sm' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </motion.div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tl-sm p-3">
                    <Loader2 size={16} className="animate-spin text-gray-500 dark:text-gray-400" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Hỏi AI Tutor..."
                  className="flex-1 py-2 px-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
