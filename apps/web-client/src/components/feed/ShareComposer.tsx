'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { Loader2, Send, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { ActionSheet } from '@/components/mobile';
import { Post } from '@/hooks/useFeed';
import { getAbsoluteUrl } from '@/lib/browser-actions';
import { formatRelativeTime } from '@/lib/time';

interface ShareComposerProps {
  open: boolean;
  post: Post;
  isPending?: boolean;
  onClose: () => void;
  onSubmit: (caption: string) => Promise<void> | void;
}

function SharePreview({ post }: { post: Post }) {
  const previewPost = post.type === 'SHARE' && post.sharedFrom ? post.sharedFrom : post;
  const media = previewPost.media?.[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-hover/40">
      <div className="flex items-start gap-3 p-3">
        <Avatar src={previewPost.author?.avatarUrl ?? undefined} fallback={previewPost.author?.fullName?.charAt(0) || '?'} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="truncate text-sm font-semibold text-foreground">{previewPost.author?.fullName || 'Người dùng'}</span>
            {previewPost.author?.hasBlueBadge && <VerifiedBadge size={13} />}
          </div>
          <p className="text-xs text-foreground/60">{formatRelativeTime(previewPost.createdAt)}</p>
        </div>
      </div>

      {previewPost.content && (
        <p className="line-clamp-4 whitespace-pre-wrap px-3 pb-3 text-sm leading-relaxed text-foreground">
          {previewPost.content}
        </p>
      )}

      {media && (
        <div className="max-h-56 overflow-hidden bg-muted">
          {media.mediaType === 'VIDEO' ? (
            <video src={media.mediaUrl} className="h-full max-h-56 w-full object-cover" muted playsInline />
          ) : (
            <img src={media.mediaUrl} alt="" className="h-full max-h-56 w-full object-cover" loading="lazy" />
          )}
        </div>
      )}

      {!previewPost.content && !media && (
        <p className="px-3 pb-3 text-sm text-foreground/60">Bài viết gốc không có nội dung hiển thị.</p>
      )}
    </div>
  );
}

export function ShareComposer({ open, post, isPending = false, onClose, onSubmit }: ShareComposerProps) {
  const [caption, setCaption] = useState('');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const textareaId = useId();
  const draftKey = useMemo(() => `cmc:share-draft:${post.id}`, [post.id]);
  const postUrl = useMemo(() => getAbsoluteUrl(`/posts/${post.id}`), [post.id]);

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    setCaption(window.localStorage.getItem(draftKey) ?? '');
  }, [draftKey, open]);

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    window.localStorage.setItem(draftKey, caption);
  }, [caption, draftKey, open]);

  const handleClose = () => {
    if (caption.trim()) {
      setShowCloseConfirm(true);
      return;
    }
    onClose();
  };

  const handleSubmit = async () => {
    await onSubmit(caption.trim());
    if (typeof window !== 'undefined') window.localStorage.removeItem(draftKey);
    setCaption('');
  };

  return (
    <ActionSheet
      open={open}
      title="Chia sẻ bài viết"
      description="Viết thêm cảm nghĩ trước khi chia sẻ lên bảng tin của bạn."
      onClose={handleClose}
      className="md:max-w-xl"
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card/70 p-3">
          <label htmlFor={textareaId} className="sr-only">Caption chia sẻ</label>
          <textarea
            id={textareaId}
            value={caption}
            onChange={(event) => setCaption(event.target.value.slice(0, 1000))}
            placeholder="Bạn muốn nói gì về bài viết này?"
            className="min-h-28 w-full resize-none rounded-xl bg-transparent p-2 text-sm leading-relaxed text-foreground outline-none placeholder:text-foreground/40"
            maxLength={1000}
            autoFocus
          />
          <div className="mt-1 flex items-center justify-between text-xs text-foreground/50">
            <span>Caption sẽ hiện phía trên bài chia sẻ.</span>
            <span>{caption.length}/1000</span>
          </div>
        </div>

        <SharePreview post={post} />

        <div className="rounded-2xl bg-hover/50 px-3 py-2 text-xs text-foreground/60">
          Link gốc: <span className="break-all text-foreground/80">{postUrl}</span>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="mobile-touch-target flex-1 rounded-2xl bg-hover px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-border disabled:opacity-50"
          >
            <X className="mr-2 inline h-4 w-4" aria-hidden="true" />
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="mobile-touch-target flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="mr-2 inline h-4 w-4" aria-hidden="true" />}
            {isPending ? 'Đang chia sẻ...' : 'Chia sẻ ngay'}
          </button>
        </div>

        {showCloseConfirm && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-sm font-semibold text-foreground">Giữ bản nháp?</p>
            <p className="mt-1 text-xs text-foreground/60">Caption đã được lưu trên máy này. Bạn có thể quay lại viết tiếp.</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setShowCloseConfirm(false)}
                className="mobile-touch-target flex-1 rounded-xl bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-hover"
              >
                Viết tiếp
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCloseConfirm(false);
                  onClose();
                }}
                className="mobile-touch-target flex-1 rounded-xl bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600"
              >
                Đóng, giữ nháp
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') window.localStorage.removeItem(draftKey);
                  setCaption('');
                  setShowCloseConfirm(false);
                  onClose();
                }}
                className="mobile-touch-target flex-1 rounded-xl bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600"
              >
                Xóa nháp
              </button>
            </div>
          </div>
        )}
      </div>
    </ActionSheet>
  );
}
