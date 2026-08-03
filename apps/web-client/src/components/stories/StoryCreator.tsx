'use client';

import { ChangeEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, Type, Image as ImageIcon, Sparkles, Video } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

// Premium gradients for text background
const TEXT_GRADIENTS = [
  'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)', // Sunset
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Ocean
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Peach
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Plum
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Mint
  'linear-gradient(135deg, #09203f 0%, #537895 100%)', // Midnight
];

interface StoryCreatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StoryCreator({ isOpen, onClose }: StoryCreatorProps) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [mode, setMode] = useState<'SELECT' | 'TEXT' | 'PHOTO' | 'VIDEO'>('SELECT');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Text Mode States
  const [textContent, setTextContent] = useState('');
  const [bgGradient, setBgGradient] = useState(TEXT_GRADIENTS[0]);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);

      if (mode === 'PHOTO' || mode === 'VIDEO') {
        if (!photoFile) return;
        const formData = new FormData();
        formData.append('file', photoFile);
        const uploadRes = await api.post('/posts/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const mediaUrl = uploadRes.data?.data?.url || uploadRes.data?.url;
        await api.post('/stories', { mediaUrl, content: 'Story' });
      }

      if (mode === 'TEXT') {
        const text = textContent.trim();
        if (!text) return;
        const mediaUrl = `text-story:${encodeURIComponent(JSON.stringify({ textContent: text, bgGradient }))}`;
        await api.post('/stories', { mediaUrl, content: text });
      }

      await qc.invalidateQueries({ queryKey: ['stories'] });
      setMode('SELECT');
      setTextContent('');
      setPhotoFile(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
      onClose();
    } catch (err) {
      console.error('Không thể đăng tin:', err);
      alert('Không thể đăng tin lúc này');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex animate-in fade-in duration-300 isolate">
      {/* Immersive Blur Background */}
      <div 
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--background) 80%, transparent)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        }}
      />

      {/* Left Sidebar - Controls */}
      <div className="w-full md:w-[360px] bg-card/60 backdrop-blur-2xl border-r border-black/5 dark:border-white/10 h-full shadow-2xl flex flex-col relative z-10 animate-in slide-in-from-left-8 duration-300">
        {/* Header */}
        <div className="flex items-center gap-4 p-5 border-b border-black/5 dark:border-white/5">
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
          <h2 className="font-bold text-[22px] tracking-tight">Tạo tin</h2>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto hide-scrollbar">
          <div className="flex items-center gap-3 mb-8 p-3 rounded-2xl bg-black/5 dark:bg-white/5">
            <Avatar src={user?.avatarUrl} fallback={user?.fullName?.charAt(0) || '?'} />
            <div>
              <p className="font-bold text-[15px] leading-tight">{user?.fullName}</p>
              <p className="text-[13px] text-muted-foreground mt-0.5">Thành viên</p>
            </div>
          </div>

          {mode === 'TEXT' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <textarea 
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Nhập nội dung tin của bạn..."
                  className="w-full h-40 p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-[15px] transition-all"
                />
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="text-[14px] font-bold text-foreground">Phông nền</p>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {TEXT_GRADIENTS.map((grad, i) => (
                    <button 
                      key={i}
                      onClick={() => setBgGradient(grad)}
                      className={`w-full aspect-square rounded-full border-2 transition-all duration-200 ${bgGradient === grad ? 'border-primary scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                      style={{ background: grad }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {(mode === 'PHOTO' || mode === 'VIDEO') && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 text-center">
                {mode === 'VIDEO' ? <Video className="w-8 h-8 text-muted-foreground" /> : <ImageIcon className="w-8 h-8 text-muted-foreground" />}
                <p className="text-[14px] text-muted-foreground">Chọn {mode === 'VIDEO' ? 'video' : 'ảnh'} để đăng lên tin</p>
                <label className="w-full mt-2">
                  <input type="file" accept={mode === 'VIDEO' ? 'video/mp4,video/webm,video/quicktime' : 'image/*'} className="hidden" onChange={handlePhotoChange} />
                  <span className="inline-flex w-full h-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground font-medium cursor-pointer hover:bg-secondary/80">
                    {photoFile ? `Chọn ${mode === 'VIDEO' ? 'video' : 'ảnh'} khác` : `Chọn ${mode === 'VIDEO' ? 'video' : 'ảnh'}`}
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-black/5 dark:border-white/5 flex gap-3 bg-card/50 backdrop-blur-md">
          <Button variant="outline" className="flex-1 rounded-xl h-12 font-semibold border-black/10 dark:border-white/10" onClick={() => setMode('SELECT')}>Hủy</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || (mode === 'TEXT' && !textContent.trim()) || ((mode === 'PHOTO' || mode === 'VIDEO') && !photoFile) || mode === 'SELECT'}
            className="flex-1 rounded-xl h-12 font-semibold bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            {submitting ? 'Đang đăng...' : 'Đăng tin'}
          </Button>
        </div>
      </div>

      {/* Right Area - Preview */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        {mode === 'SELECT' ? (
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Create Photo Story Button */}
            <button 
              onClick={() => setMode('PHOTO')} 
              className="group relative w-56 h-72 rounded-[24px] overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)] focus:outline-none"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#1877F2] to-[#0A53BE] opacity-90" />
              <div className="relative h-full flex flex-col items-center justify-center p-6">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-[#1877F2] mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <ImageIcon className="w-7 h-7" />
                </div>
                <span className="font-bold text-[18px] text-white">Tạo tin ảnh</span>
              </div>
            </button>

            <button
              onClick={() => setMode('VIDEO')}
              className="group relative w-56 h-72 rounded-[24px] overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(239,68,68,0.3)] focus:outline-none"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#ef4444] to-[#991b1b] opacity-90" />
              <div className="relative h-full flex flex-col items-center justify-center p-6">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-[#ef4444] mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Video className="w-7 h-7" />
                </div>
                <span className="font-bold text-[18px] text-white">Tạo tin video</span>
              </div>
            </button>

            {/* Create Text Story Button */}
            <button 
              onClick={() => setMode('TEXT')} 
              className="group relative w-56 h-72 rounded-[24px] overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(168,85,247,0.3)] focus:outline-none"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#b066fe] to-[#63e2ff] opacity-90" />
              <div className="relative h-full flex flex-col items-center justify-center p-6">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-[#b066fe] mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Type className="w-7 h-7" />
                </div>
                <span className="font-bold text-[18px] text-white">Tạo tin văn bản</span>
              </div>
            </button>
          </div>
        ) : (
          <div className="w-full max-w-[360px] aspect-[9/16] relative animate-in zoom-in-95 duration-300">
            {/* Simple Clean Card Preview */}
            <div className="absolute inset-0 bg-card rounded-2xl overflow-hidden shadow-xl border border-black/5 dark:border-white/10 isolate">
              {mode === 'TEXT' && (
                <div 
                  className="w-full h-full flex flex-col p-8 transition-colors duration-500" 
                  style={{ background: bgGradient }}
                >
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-white text-center font-bold text-[28px] leading-tight break-words w-full whitespace-pre-wrap drop-shadow-md">
                      {textContent || 'Bắt đầu nhập'}
                    </p>
                  </div>
                </div>
              )}
              {mode === 'PHOTO' && (
                photoPreview ? (
                  <img src={photoPreview} alt="Xem trước tin" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5">
                    <ImageIcon className="w-16 h-16 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground text-center font-medium">Bản xem trước ảnh</p>
                  </div>
                )
              )}
              {mode === 'VIDEO' && (
                photoPreview ? (
                  <video src={photoPreview} className="w-full h-full object-contain bg-black" controls autoPlay muted playsInline />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5">
                    <Video className="w-16 h-16 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground text-center font-medium">Bản xem trước video</p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
