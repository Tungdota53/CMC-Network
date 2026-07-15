'use client';

import { useEffect, useState, useCallback } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { X, Play, Pause, Volume2, VolumeX, Heart, ThumbsUp, MessageCircle, Send } from 'lucide-react';
import { StoryUserGroup, Story } from '@/hooks/useStories';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { formatRelativeTime } from '@/lib/time';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface StoryViewerProps {
  users: StoryUserGroup[];
  initialUserIndex: number;
  onClose: () => void;
}

export function StoryViewer({ users, initialUserIndex, onClose }: StoryViewerProps) {
  const { user } = useAuthStore();
  const [currentUserIdx, setCurrentUserIdx] = useState(initialUserIndex);
  const [currentStoryIdx, setCurrentStoryIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const currentUser = users[currentUserIdx];
  const currentStory: Story | undefined = currentUser?.stories[currentStoryIdx];

  // Auto-advance logic and gesture placeholders
  const handleNext = useCallback(() => {
    if (!currentUser) return;
    if (currentStoryIdx < currentUser.stories.length - 1) {
      setCurrentStoryIdx(currentStoryIdx + 1);
    } else if (currentUserIdx < users.length - 1) {
      setCurrentUserIdx(currentUserIdx + 1);
      setCurrentStoryIdx(0);
    } else {
      onClose();
    }
  }, [currentStoryIdx, currentUserIdx, currentUser, users.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentStoryIdx > 0) {
      setCurrentStoryIdx(currentStoryIdx - 1);
    } else if (currentUserIdx > 0) {
      setCurrentUserIdx(currentUserIdx - 1);
      setCurrentStoryIdx(users[currentUserIdx - 1].stories.length - 1);
    }
  }, [currentStoryIdx, currentUserIdx, users]);

  const sendStoryReply = useCallback(async (quickText?: string) => {
    if (!currentUser || !currentStory || sendingReply) return;
    if (user?.id === currentUser.userId) return;

    const text = (quickText ?? replyText).trim();
    if (!text) return;

    try {
      setSendingReply(true);
      const conversationRes = await api.post('/conversations', {
        type: 'DIRECT',
        participantIds: [currentUser.userId],
      });
      const conversationId = conversationRes.data?.data?.id || conversationRes.data?.id;
      if (!conversationId) throw new Error('Không tạo được cuộc trò chuyện');

      await api.post(`/conversations/${conversationId}/messages`, {
        content: `${text}\n\nTrả lời story: ${currentStory.textContent || currentStory.mediaUrl || currentStory.id}`,
        type: 'TEXT',
      });
      setReplyText('');
    } catch (error) {
      console.error('Không thể gửi trả lời story:', error);
      alert('Không thể gửi trả lời story lúc này');
    } finally {
      setSendingReply(false);
    }
  }, [currentStory, currentUser, replyText, sendingReply, user?.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ') setIsPaused((p) => !p);
      if (e.key === 'm') setIsMuted((m) => !m);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  if (!currentUser || !currentStory) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      {/* Background blur/gradient */}
      <div className="absolute inset-0 opacity-40 blur-2xl">
        {currentStory.thumbnailUrl && <img src={currentStory.thumbnailUrl} className="w-full h-full object-cover" alt="" />}
      </div>

      <div className="relative w-full max-w-[400px] h-[100dvh] md:h-[90vh] md:rounded-xl overflow-hidden bg-gray-900 flex flex-col shadow-2xl">
        
        {/* Header (Progress bars + Info) */}
        <div className="absolute top-0 left-0 w-full z-20 pt-4 px-3 bg-gradient-to-b from-black/60 to-transparent">
          {/* Progress Bars */}
          <div className="flex gap-1 mb-3">
            {currentUser.stories.map((s, i) => (
              <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-white transition-all duration-[${currentStory.duration}s] ease-linear`}
                  style={{ 
                    width: i < currentStoryIdx ? '100%' : i === currentStoryIdx ? (isPaused ? '50%' : '0%') : '0%' // Mock progress
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar src={currentUser.avatarUrl || undefined} fallback={currentUser.fullName.charAt(0)} size="sm" />
              <div>
                <p className="font-semibold text-white text-sm drop-shadow-md flex items-center gap-1">
                  {currentUser.fullName}
                  {currentUser.hasBlueBadge && <VerifiedBadge size={14} className="text-blue-400" />}
                </p>
                <p className="text-white/80 text-xs drop-shadow-md">
                  {formatRelativeTime(currentStory.createdAt)} · tự xoá sau 24h
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsPaused(!isPaused)} className="p-1 text-white hover:bg-white/20 rounded-full transition">
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
              <button onClick={() => setIsMuted(!isMuted)} className="p-1 text-white hover:bg-white/20 rounded-full transition">
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <button onClick={onClose} className="p-1 text-white hover:bg-white/20 rounded-full transition">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div 
          className="flex-1 relative flex items-center justify-center cursor-pointer"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Tap Zones */}
          <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={(e) => { e.stopPropagation(); handlePrev(); }} />
          <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={(e) => { e.stopPropagation(); handleNext(); }} />

          {/* Render Media / Text */}
          {currentStory.type === 'IMAGE' && (
            <img src={currentStory.mediaUrl} alt="" className="w-full h-full object-contain pointer-events-none" />
          )}
          {currentStory.type === 'VIDEO' && (
            <video src={currentStory.mediaUrl} className="w-full h-full object-contain pointer-events-none" autoPlay muted={isMuted} loop />
          )}
          {currentStory.type === 'TEXT' && (
            <div 
              className="w-full h-full flex items-center justify-center p-6"
              style={{ background: currentStory.bgGradient || currentStory.bgColor || '#1877F2' }}
            >
              <p 
                className="text-white text-center font-bold"
                style={{ 
                  fontFamily: currentStory.fontStyle || 'inherit',
                  fontSize: `${currentStory.fontSize || 28}px`
                }}
              >
                {currentStory.textContent}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions (Reply & React) */}
        <div className="absolute bottom-0 left-0 w-full z-20 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-3">
          <div className="flex-1 bg-black/40 border border-white/30 rounded-full px-4 py-2.5 flex items-center gap-2 focus-within:bg-black/60 focus-within:border-white/60 transition">
            <MessageCircle className="w-5 h-5 text-white/70" />
            <input 
              type="text" 
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void sendStoryReply();
                }
              }}
              disabled={user?.id === currentUser.userId || sendingReply}
              placeholder={user?.id === currentUser.userId ? 'Story của bạn' : 'Trả lời...'} 
              className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/70"
            />
          </div>
          {replyText.trim() ? (
            <button disabled={sendingReply} onClick={() => void sendStoryReply()} className="p-2.5 rounded-full hover:bg-white/20 transition disabled:opacity-50" aria-label="Gửi trả lời story">
              <Send className="w-6 h-6 text-white" />
            </button>
          ) : null}
          <button onClick={() => void sendStoryReply('❤️')} className="p-2.5 rounded-full hover:bg-white/20 transition group" disabled={user?.id === currentUser.userId || sendingReply}>
            <Heart className="w-6 h-6 text-white group-hover:text-red-500 group-hover:fill-red-500 transition-colors" />
          </button>
          <button onClick={() => void sendStoryReply('👍')} className="p-2.5 rounded-full hover:bg-white/20 transition group" disabled={user?.id === currentUser.userId || sendingReply}>
            <ThumbsUp className="w-6 h-6 text-white group-hover:text-blue-500 group-hover:fill-blue-500 transition-colors" />
          </button>
        </div>

      </div>
    </div>
  );
}
