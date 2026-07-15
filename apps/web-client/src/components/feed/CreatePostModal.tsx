'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useCreatePost } from '@/hooks/useFeed';
import {
  ImageIcon, BarChart2Icon, X, Globe, Users, Lock,
  Plus, Trash2, GripVertical, CalendarClock,
} from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PostMode = 'text' | 'media' | 'poll';

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_CONTENT_LENGTH = 10000;
const CREATE_POST_DRAFT_KEY = 'cmc:create-post-draft';

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const { user } = useAuthStore();
  const createPost = useCreatePost();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'FRIENDS' | 'PRIVATE'>('PUBLIC');
  const [mode, setMode] = useState<PostMode>('text');

  // Media state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Poll state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollMultiChoice, setPollMultiChoice] = useState(false);
  const [pollExpiresAt, setPollExpiresAt] = useState('');

  // Error state
  const [error, setError] = useState('');

  // Auto-focus textarea on open
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
    if (isOpen && typeof window !== 'undefined') {
      setContent(window.localStorage.getItem(CREATE_POST_DRAFT_KEY) ?? '');
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (content.trim()) window.localStorage.setItem(CREATE_POST_DRAFT_KEY, content);
    else window.localStorage.removeItem(CREATE_POST_DRAFT_KEY);
  }, [content]);

  // Cleanup preview URLs on unmount only (not on every change — that would revoke URLs still in use)
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const resetForm = useCallback(() => {
    setContent('');
    setMode('text');
    setSelectedFiles([]);
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setPollQuestion('');
    setPollOptions(['', '']);
    setPollMultiChoice(false);
    setPollExpiresAt('');
    setError('');
  }, [previewUrls]);

  const clearSelectedFiles = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
  };

  const handleClose = () => {
    onClose();
  };

  // === FILE HANDLING ===
  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const filesArray = Array.from(newFiles);
    const validFiles: File[] = [];
    
    for (const file of filesArray) {
      if (selectedFiles.length + validFiles.length >= MAX_FILES) {
        setError(`Tối đa ${MAX_FILES} file`);
        break;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" vượt quá 10MB`);
        continue;
      }
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setError(`File "${file.name}" không phải ảnh/video`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setPreviewUrls(prev => [...prev, ...validFiles.map(f => URL.createObjectURL(f))]);
      setMode('media');
      setError('');
    }
  }, [selectedFiles.length]);

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    if (selectedFiles.length <= 1) setMode('text');
  };

  // === POLL HANDLING ===
  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions(prev => [...prev, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    setPollOptions(prev => prev.map((opt, i) => i === index ? value : opt));
  };

  // === SUBMIT ===
  const canSubmit = () => {
    if (createPost.isPending) return false;
    if (mode === 'poll') {
      return pollQuestion.trim().length > 0 && pollOptions.filter(o => o.trim()).length >= 2;
    }
    return content.trim().length > 0 || selectedFiles.length > 0;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    setError('');

    try {
      const payload: any = { userId: user?.id, content: content.trim() || undefined, visibility };

      if (mode === 'media' && selectedFiles.length > 0) {
        // Detect type from files
        const hasVideo = selectedFiles.some(f => f.type.startsWith('video/'));
        payload.type = hasVideo ? 'VIDEO' : 'PHOTO';
        payload.files = selectedFiles;
      } else if (mode === 'poll') {
        payload.type = 'POLL';
        payload.poll = {
          question: pollQuestion.trim(),
          options: pollOptions.filter(o => o.trim()),
          isMultipleChoice: pollMultiChoice,
          expiresAt: pollExpiresAt || undefined,
        };
      }

      await createPost.mutateAsync(payload);
      if (typeof window !== 'undefined') window.localStorage.removeItem(CREATE_POST_DRAFT_KEY);
      resetForm();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi đăng bài');
    }
  };

  if (!isOpen) return null;

  const visibilityOptions = [
    { value: 'PUBLIC' as const, icon: Globe, label: 'Công khai' },
    { value: 'FRIENDS' as const, icon: Users, label: 'Bạn bè' },
    { value: 'PRIVATE' as const, icon: Lock, label: 'Chỉ mình tôi' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={handleClose}>
      <div
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-4 duration-200 sm:mx-4 sm:max-w-lg sm:rounded-2xl sm:fade-in sm:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-post-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div />
          <h2 id="create-post-title" className="text-xl font-bold text-foreground">Tạo bài viết</h2>
          <button onClick={handleClose} className="flex h-11 w-11 items-center justify-center rounded-full bg-hover text-foreground/60 transition-colors hover:bg-border" aria-label="Đóng tạo bài viết">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Author */}
        <div className="flex items-center gap-3 p-4 pb-2">
          <Avatar src={user?.avatarUrl} fallback={user?.fullName?.charAt(0) || '?'} />
          <div>
            <p className="font-semibold text-foreground text-sm">{user?.fullName || 'Bạn'}</p>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
              className="text-xs bg-hover rounded-md px-2 py-1 text-foreground/70 border border-border outline-none cursor-pointer"
            >
              {visibilityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {/* Textarea */}
          <div className="px-4 pb-2">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CONTENT_LENGTH) {
                  setContent(e.target.value);
                }
              }}
              placeholder={`${user?.fullName || 'Bạn'} ơi, bạn đang nghĩ gì thế?`}
              className="min-h-[120px] w-full resize-none border-none bg-transparent text-lg text-foreground outline-none placeholder:text-foreground/40 max-sm:min-h-[150px]"
              autoFocus
            />
            {content.length > MAX_CONTENT_LENGTH * 0.9 && (
              <p className={`text-xs text-right ${content.length >= MAX_CONTENT_LENGTH ? 'text-red-500' : 'text-foreground/40'}`}>
                {content.length}/{MAX_CONTENT_LENGTH}
              </p>
            )}
          </div>

          {/* Media Preview Grid */}
          {selectedFiles.length > 0 && (
            <div className="px-4 pb-3">
              <div className={`grid gap-1 rounded-xl overflow-hidden border border-border ${
                selectedFiles.length === 1 ? 'grid-cols-1' : 
                selectedFiles.length === 2 ? 'grid-cols-2' : 
                selectedFiles.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
              }`}>
                {selectedFiles.map((file, index) => (
                  <div key={index} className={`group relative overflow-hidden bg-hover ${
                    selectedFiles.length === 1 ? 'max-h-[300px]' : 
                    selectedFiles.length <= 4 ? 'aspect-square max-h-[180px]' : 'aspect-square max-h-[140px]'
                  } ${index === 0 && selectedFiles.length === 3 ? 'row-span-2 h-full' : ''}`}>
                    {file.type.startsWith('video/') ? (
                      <video src={previewUrls[index]} className="w-full h-full object-cover" />
                    ) : (
                      <img src={previewUrls[index]} alt="" className="w-full h-full object-cover" />
                    )}
                    {/* Remove button */}
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 sm:h-7 sm:w-7 sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label={`Xóa file ${index + 1}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {/* File type badge */}
                    {file.type.startsWith('video/') && (
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs font-medium">
                        VIDEO
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {selectedFiles.length < MAX_FILES && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 flex min-h-11 w-full items-center justify-center gap-1 rounded-2xl border border-dashed border-border py-2 text-sm font-medium text-foreground/60 transition-colors hover:bg-hover"
                >
                  <Plus className="w-4 h-4" /> Thêm ảnh/video ({selectedFiles.length}/{MAX_FILES})
                </button>
              )}
            </div>
          )}

          {/* Poll Creator */}
          {mode === 'poll' && (
            <div className="px-4 pb-3 space-y-3">
              <div className="bg-hover rounded-xl p-4 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground text-sm">Tạo bình chọn</h3>
                    <button onClick={() => { setMode('text'); setPollQuestion(''); setPollOptions(['', '']); }} className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/40 hover:bg-card hover:text-foreground" aria-label="Xóa bình chọn">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Question */}
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Đặt câu hỏi..."
                  className="min-h-11 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/40 focus:border-primary"
                />

                {/* Options */}
                <div className="space-y-2">
                  {pollOptions.map((opt, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-foreground/30 shrink-0" />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updatePollOption(index, e.target.value)}
                        placeholder={`Lựa chọn ${index + 1}`}
                        className="min-h-11 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/40 focus:border-primary"
                      />
                      {pollOptions.length > 2 && (
                        <button onClick={() => removePollOption(index)} className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/40 transition-colors hover:bg-card hover:text-red-500" aria-label={`Xóa lựa chọn ${index + 1}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {pollOptions.length < 6 && (
                  <button
                    onClick={addPollOption}
                    className="flex min-h-11 w-full items-center justify-center gap-1 rounded-2xl border border-dashed border-border py-2 text-sm font-medium text-foreground/60 transition-colors hover:bg-card"
                  >
                    <Plus className="w-4 h-4" /> Thêm lựa chọn
                  </button>
                )}

                {/* Poll settings */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pollMultiChoice}
                      onChange={(e) => setPollMultiChoice(e.target.checked)}
                      className="rounded accent-primary"
                    />
                    <span className="text-xs text-foreground/70">Cho phép chọn nhiều</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5 text-foreground/50" />
                    <input
                      type="datetime-local"
                      value={pollExpiresAt}
                      onChange={(e) => setPollExpiresAt(e.target.value)}
                      className="text-xs bg-transparent text-foreground/70 outline-none border-none"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="mx-4 mb-3 flex items-center justify-between rounded-2xl border border-border p-3">
          <span className="font-semibold text-sm text-foreground">Thêm vào bài viết</span>
          <div className="flex gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${mode === 'media' ? 'bg-green-500/10' : 'hover:bg-hover'}`}
              title="Ảnh/Video"
              aria-label="Thêm ảnh hoặc video"
              disabled={mode === 'poll'}
            >
              <ImageIcon className={`w-6 h-6 ${mode === 'poll' ? 'text-foreground/30' : 'text-green-500'}`} />
            </button>
            <button
              onClick={() => {
                if (mode === 'poll') {
                  setMode('text');
                  setPollQuestion('');
                  setPollOptions(['', '']);
                } else {
                  setMode('poll');
                  clearSelectedFiles();
                }
              }}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${mode === 'poll' ? 'bg-blue-500/10' : 'hover:bg-hover'}`}
              title="Bình chọn"
              aria-label="Tạo bình chọn"
              disabled={selectedFiles.length > 0}
            >
              <BarChart2Icon className={`w-6 h-6 ${selectedFiles.length > 0 ? 'text-foreground/30' : 'text-blue-500'}`} />
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = ''; // Reset to allow re-selecting same file
          }}
          className="hidden"
        />

        {/* Submit */}
        <div className="sticky bottom-0 border-t border-border bg-card/95 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 backdrop-blur sm:static sm:border-t-0 sm:pb-4 sm:pt-0">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            isLoading={createPost.isPending}
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold disabled:opacity-50"
            size="md"
          >
            Đăng
          </Button>
        </div>
      </div>
    </div>
  );
}
