'use client';

import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Avatar } from '@/components/ui/Avatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import {
  MoreHorizontal, ThumbsUp, MessageCircle, Share2,
  Bookmark, BookmarkCheck, Pin, Globe, Users,
  Trash2, Lock, Unlock, Flag, EyeOff, Copy, Check, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { Post } from '@/hooks/useFeed';
import {
  useReactPost, useUnreactPost, useSavePost, useUnsavePost,
  useSharePost, useDeletePost, useLockComments, useReportPost,
  useHidePost, useUnhidePost,
} from '@/hooks/useFeed';
import { useAuthStore } from '@/store/authStore';
import { CommentSection } from './CommentSection';
import { ShareComposer } from './ShareComposer';
import { copyTextToClipboard, getAbsoluteUrl, shareUrl } from '@/lib/browser-actions';
import { formatRelativeTime } from '@/lib/time';
import api from '@/lib/api';

function timeAgo(dateStr: string): string {
  return formatRelativeTime(dateStr);
}

// Reaction config
const REACTIONS = [
  { type: 'LIKE', emoji: '👍', label: 'Thích', color: 'text-blue-500' },
  { type: 'LOVE', emoji: '❤️', label: 'Yêu thích', color: 'text-red-500' },
  { type: 'HAHA', emoji: '😂', label: 'Haha', color: 'text-yellow-500' },
  { type: 'WOW', emoji: '😮', label: 'Wow', color: 'text-yellow-500' },
  { type: 'SAD', emoji: '😢', label: 'Buồn', color: 'text-yellow-500' },
  { type: 'ANGRY', emoji: '😡', label: 'Phẫn nộ', color: 'text-orange-500' },
] as const;

function getReactionDisplay(type: string | null) {
  const reaction = REACTIONS.find(r => r.type === type);
  if (!reaction) return { emoji: null, label: 'Thích', color: 'text-foreground/80' };
  return reaction;
}

function SharedPostPreview({ post }: { post: Post }) {
  return (
    <div className="mx-3 mb-3 overflow-hidden rounded-2xl border border-border bg-background/40 sm:mx-4">
      <div className="flex items-start gap-3 p-3">
        <Avatar src={post.author?.avatarUrl ?? undefined} fallback={post.author?.fullName?.charAt(0) || '?'} />
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <Link
              href={`/profile/${post.author?.profileSlug || post.author?.id || ''}`}
              className="font-semibold text-foreground hover:underline text-sm"
            >
              {post.author?.fullName || 'Người dùng'}
            </Link>
            {post.author?.hasBlueBadge && <VerifiedBadge size={13} />}
          </div>
          <div className="text-xs text-foreground/60">{timeAgo(post.createdAt)}</div>
        </div>
      </div>

      {post.content && (
        <div className="px-3 pb-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
          {post.content}
        </div>
      )}

      {post.media && post.media.length > 0 && (
        <div className={`grid gap-0.5 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.media.slice(0, 4).map((m, i) => (
            <div key={m.id} className={`relative overflow-hidden bg-hover ${post.media.length === 1 ? 'max-h-[360px]' : 'aspect-square max-h-[180px]'}`}>
              {m.mediaType === 'VIDEO' ? (
                <video src={m.mediaUrl} className="w-full h-full object-cover" controls />
              ) : (
                <img src={m.mediaUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
              )}
              {i === 3 && post.media.length > 4 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-2xl font-bold">
                  +{post.media.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!post.content && (!post.media || post.media.length === 0) && (
        <div className="px-3 pb-3 text-sm text-foreground/60">Bài viết gốc không có nội dung hiển thị.</div>
      )}
    </div>
  );
}

interface PostCardProps {
  post: Post;
  onDeleted?: () => void;
}

export function PostCard({ post, onDeleted }: PostCardProps) {
  const { user } = useAuthStore();
  const [showComments, setShowComments] = useState(false);
  const [userReaction, setUserReaction] = useState<string | null>(post.userReaction ?? null);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isSaved, setIsSaved] = useState(!!post.isSaved);
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [showChatShare, setShowChatShare] = useState(false);
  const [chatShareLoading, setChatShareLoading] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [reportReason, setReportReason] = useState('Nội dung không phù hợp');
  const [showShareComposer, setShowShareComposer] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareCount, setShareCount] = useState(post.shareCount);

  const menuRef = useRef<HTMLDivElement>(null);
  const reactionRef = useRef<HTMLDivElement>(null);
  const reactionTimeout = useRef<NodeJS.Timeout | null>(null);

  const isAuthor = user?.id === post.author?.id;

  const reactMutation = useReactPost();
  const unreactMutation = useUnreactPost();
  const saveMutation = useSavePost();
  const unsaveMutation = useUnsavePost();
  const shareMutation = useSharePost();
  const reportMutation = useReportPost();
  const hideMutation = useHidePost();
  const unhideMutation = useUnhidePost();
  const deleteMutation = useDeletePost();
  const lockMutation = useLockComments();

  // Close menu/reactions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
      if (reactionRef.current && !reactionRef.current.contains(e.target as Node)) setShowReactions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // === HANDLERS ===
  const handleReaction = async (type: string) => {
    setShowReactions(false);
    if (userReaction === type) {
      // Toggle off
      setUserReaction(null);
      setLikeCount(c => c - 1);
      try { await unreactMutation.mutateAsync(post.id); }
      catch { setUserReaction(type); setLikeCount(c => c + 1); }
    } else {
      const wasReacted = !!userReaction;
      setUserReaction(type);
      if (!wasReacted) setLikeCount(c => c + 1);
      try { await reactMutation.mutateAsync({ postId: post.id, reactionType: type }); }
      catch {
        setUserReaction(wasReacted ? userReaction : null);
        if (!wasReacted) setLikeCount(c => c - 1);
      }
    }
  };

  const handleQuickLike = () => {
    if (userReaction) {
      handleReaction(userReaction); // Toggle off current
    } else {
      handleReaction('LIKE'); // Quick like
    }
  };

  const handleSave = async () => {
    const wasSaved = isSaved;
    setIsSaved(!isSaved);
    try {
      if (wasSaved) {
        await unsaveMutation.mutateAsync(post.id);
      } else {
        await saveMutation.mutateAsync(post.id);
      }
    } catch {
      setIsSaved(wasSaved);
    }
  };

  const postUrl = getAbsoluteUrl(`/posts/${post.id}`);

  const handleCopyLink = async () => {
    try {
      await copyTextToClipboard(postUrl);
      setCopied(true);
      setShowMenu(false);
      toast.success('Đã copy link bài viết');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Không thể copy link lúc này');
    }
  };

  const handleShare = async (content: string) => {
    setShareCount(c => c + 1);
    try {
      await shareMutation.mutateAsync({ postId: post.id, content });
      setShowShareComposer(false);
      toast.success('Đã chia sẻ bài viết');
    } catch {
      setShareCount(c => c - 1);
      toast.error('Không thể chia sẻ bài viết');
    }
  };

  const getShareTitle = () => {
    const authorName = post.author?.fullName || 'CMC Network';
    return `Bài viết của ${authorName}`;
  };

  const handleNativeShare = async () => {
    setShowMenu(false);
    try {
      await shareUrl({
        title: getShareTitle(),
        text: 'Xem bài viết này trên CMC Network',
        url: postUrl,
      });
      toast.success('Đã mở chia sẻ');
    } catch {
      toast.error('Không thể chia sẻ lúc này');
    }
  };

  const openChatShare = async () => {
    setShowMenu(false);
    setShowChatShare(true);
    setChatShareLoading(true);
    try {
      const res = await api.get('/conversations');
      const payload = res.data?.data ?? res.data;
      setConversations(Array.isArray(payload) ? payload : (payload?.conversations ?? []));
    } catch {
      toast.error('Không tải được danh sách chat');
      setConversations([]);
    } finally {
      setChatShareLoading(false);
    }
  };

  const handleShareToChat = async (conversation: any) => {
    try {
      await api.post(`/conversations/${conversation.id}/messages`, {
        content: `${getShareTitle()}\n${postUrl}`,
        type: 'TEXT',
      });
      setShowChatShare(false);
      toast.success('Đã gửi bài viết vào chat');
    } catch {
      toast.error('Không gửi được vào chat');
    }
  };

  const handleHidePost = async () => {
    setIsHidden(true);
    setShowMenu(false);
    try {
      await hideMutation.mutateAsync(post.id);
    } catch {
      setIsHidden(false);
      toast.error('Không thể ẩn bài viết');
      return;
    }
    toast((t) => (
      <div className="flex items-center gap-3">
        <span>Đã ẩn bài viết</span>
        <button
          onClick={async () => {
            setIsHidden(false);
            await unhideMutation.mutateAsync(post.id).catch(() => undefined);
            toast.dismiss(t.id);
          }}
          className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
        >
          Hoàn tác
        </button>
      </div>
    ));
  };

  const handleReportPost = async () => {
    try {
      await reportMutation.mutateAsync({ postId: post.id, reason: reportReason.trim() || 'Nội dung không phù hợp' });
      setShowReportConfirm(false);
      setShowMenu(false);
      toast.success('Đã gửi báo cáo. Quản trị viên sẽ xem lại.');
    } catch {
      toast.error('Không thể gửi báo cáo lúc này');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(post.id);
      setShowDeleteConfirm(false);
      setShowMenu(false);
      onDeleted?.();
      toast.success('Đã xóa bài viết');
    } catch {
      toast.error('Không thể xóa bài viết');
    }
  };

  const handleLockComments = async () => {
    try {
      await lockMutation.mutateAsync({ postId: post.id, lock: !post.isCommentLocked });
      setShowMenu(false);
      toast.success(post.isCommentLocked ? 'Đã mở bình luận' : 'Đã khóa bình luận');
    } catch {
      toast.error('Không thể cập nhật bình luận');
    }
  };

  const currentReaction = getReactionDisplay(userReaction);

  if (isHidden) {
    return (
      <article className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-foreground">Đã ẩn bài viết</p>
            <p className="text-sm text-muted-foreground">Bài viết này chỉ bị ẩn tạm trên màn hình của bạn.</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              setIsHidden(false);
              await unhideMutation.mutateAsync(post.id).catch(() => undefined);
            }}
            className="min-h-11 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Hoàn tác
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="relative isolate rounded-2xl shadow-sm transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
      {/* Glass Background Layer */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none -z-10"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--card) 60%, transparent)',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      />
      <div className="relative z-10 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 p-3 sm:p-4">
          <div className="flex min-w-0 gap-3">
            <Avatar src={post.author?.avatarUrl ?? undefined} fallback={post.author?.fullName?.charAt(0) || '?'} />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <Link
                  href={`/profile/${post.author?.profileSlug || post.author?.id || ''}`}
                  className="truncate text-[15px] font-semibold text-foreground hover:underline"
                >
                  {post.author?.fullName || 'Người dùng'}
                </Link>
                {post.author?.hasBlueBadge && <VerifiedBadge size={14} />}
              </div>
              <div className="text-xs text-foreground/60 flex items-center gap-1">
                <span>{timeAgo(post.createdAt)}</span>
                <span>·</span>
                {post.visibility === 'FRIENDS' ? (
                  <Users className="w-3 h-3" />
                ) : (
                  <Globe className="w-3 h-3" />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {post.isPinned && <Pin className="w-4 h-4 text-primary" />}
            <button
              onClick={handleSave}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-hover"
              aria-label={isSaved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
            >
              {isSaved ? (
                <BookmarkCheck className="w-5 h-5 text-primary" />
              ) : (
                <Bookmark className="w-5 h-5 text-foreground/60" />
              )}
            </button>

            {/* 3-dot Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-hover"
                aria-label="Mở menu bài viết"
                aria-expanded={showMenu}
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {showMenu && (
                <>
                <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] md:hidden" aria-hidden="true" />
                <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-border bg-card py-1 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150 max-md:fixed max-md:inset-x-3 max-md:bottom-[calc(var(--mobile-bottom-nav-height)+var(--mobile-safe-bottom)+0.75rem)] max-md:top-auto max-md:max-h-[calc(100dvh-7rem)] max-md:w-auto max-md:overflow-y-auto max-md:rounded-3xl max-md:p-2">
                  <button
                    onClick={() => { setShowShareComposer(true); setShowMenu(false); }}
                    className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-hover"
                  >
                    <Share2 className="w-4 h-4" />
                    Chia sẻ kèm caption
                  </button>
                  <button
                    onClick={openChatShare}
                    className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-hover"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chia sẻ vào chat/nhóm
                  </button>
                  <button
                    onClick={handleNativeShare}
                    className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-hover"
                  >
                    <Share2 className="w-4 h-4" />
                    Chia sẻ bằng máy
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-hover"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    Copy link
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-hover"
                  >
                    {isSaved ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4" />}
                    {isSaved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
                  </button>
                  {isAuthor && (
                    <>
                      <button
                        onClick={handleLockComments}
                        className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-hover"
                      >
                        {post.isCommentLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        {post.isCommentLocked ? 'Mở bình luận' : 'Khóa bình luận'}
                      </button>
                      <button
                        onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }}
                        className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-hover"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa bài viết
                      </button>
                    </>
                  )}
                  {!isAuthor && (
                    <>
                      <button onClick={handleHidePost} className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-hover">
                        <EyeOff className="w-4 h-4" />
                        Ẩn bài viết
                      </button>
                      <button onClick={() => { setShowReportConfirm(true); setShowMenu(false); }} className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-hover">
                        <Flag className="w-4 h-4" />
                        Báo cáo bài viết
                      </button>
                    </>
                  )}
                </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {post.content && (
          <div className="whitespace-pre-wrap break-words px-3 pb-3 text-[15px] leading-relaxed text-foreground sm:px-4">
            {post.content}
          </div>
        )}

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <div className={`grid gap-0.5 ${post.media.length === 1 ? 'grid-cols-1' : post.media.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
            {post.media.slice(0, 4).map((m, i) => (
              <div key={m.id} className={`relative overflow-hidden bg-hover ${post.media.length === 1 ? 'max-h-[500px] max-sm:max-h-[420px]' : 'aspect-square max-h-[250px]'}`}>
                {m.mediaType === 'VIDEO' ? (
                  <video src={m.mediaUrl} className="w-full h-full object-cover" controls />
                ) : (
                  <img src={m.mediaUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                )}
                {i === 3 && post.media.length > 4 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-3xl font-bold">
                    +{post.media.length - 4}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Link Preview */}
        {post.linkPreview && (
          <a
            href={post.linkPreview.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-3 mb-3 block overflow-hidden rounded-2xl border border-border transition-colors hover:bg-hover sm:mx-4"
          >
            {post.linkPreview.imageUrl && (
              <img src={post.linkPreview.imageUrl} alt="" className="w-full h-40 object-cover" />
            )}
            <div className="p-3">
              <p className="text-xs text-foreground/60 uppercase">{post.linkPreview.siteName}</p>
              <p className="font-semibold text-sm text-foreground line-clamp-2">{post.linkPreview.title}</p>
              {post.linkPreview.description && (
                <p className="text-xs text-foreground/60 line-clamp-2 mt-1">{post.linkPreview.description}</p>
              )}
            </div>
          </a>
        )}

        {post.type === 'SHARE' && post.sharedFrom && <SharedPostPreview post={post.sharedFrom} />}

        {/* Stats */}
        {(likeCount > 0 || post.commentCount > 0 || shareCount > 0) && (
          <div className="flex justify-between gap-3 px-3 py-2 text-xs text-foreground/60 sm:px-4">
            <div className="flex items-center gap-1">
              {likeCount > 0 && (
                <>
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <ThumbsUp className="w-3 h-3 text-white" />
                  </div>
                  <span>{likeCount}</span>
                </>
              )}
            </div>
            <div className="flex min-w-0 flex-wrap justify-end gap-x-3 gap-y-1">
              {post.commentCount > 0 && (
                <button onClick={() => setShowComments(!showComments)} className="hover:underline">
                  {post.commentCount} bình luận
                </button>
              )}
              {shareCount > 0 && <span>{shareCount} lượt chia sẻ</span>}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center border-t border-border px-1 py-1 sm:px-2">
          {/* Like / Reaction Button */}
          <div className="flex-1 relative" ref={reactionRef}>
            <button
              onClick={handleQuickLike}
              onMouseEnter={() => {
                reactionTimeout.current = setTimeout(() => setShowReactions(true), 500);
              }}
              onMouseLeave={() => {
                if (reactionTimeout.current) clearTimeout(reactionTimeout.current);
              }}
              className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors
                ${userReaction ? `${currentReaction.color} hover:bg-primary/10` : 'text-foreground/80 hover:bg-hover'}`}
              aria-label={userReaction ? `Bỏ cảm xúc ${currentReaction.label}` : 'Thích bài viết'}
            >
              {userReaction ? (
                <span className="text-lg leading-none">{currentReaction.emoji}</span>
              ) : (
                <ThumbsUp className="w-5 h-5" />
              )}
              <span className="hidden min-[380px]:inline">{currentReaction.label}</span>
            </button>

            {/* Reactions Picker Popup */}
            {showReactions && (
              <div
                className="absolute bottom-full left-0 mb-2 flex gap-1 bg-card border border-border rounded-full shadow-xl px-2 py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
                onMouseEnter={() => {
                  if (reactionTimeout.current) clearTimeout(reactionTimeout.current);
                }}
                onMouseLeave={() => setShowReactions(false)}
              >
                {REACTIONS.map((r) => (
                  <button
                    key={r.type}
                    onClick={() => handleReaction(r.type)}
                    className={`text-2xl hover:scale-125 transition-transform p-1 rounded-full ${userReaction === r.type ? 'bg-hover scale-110' : ''}`}
                    title={r.label}
                    aria-label={r.label}
                  >
                    {r.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-hover"
            aria-expanded={showComments}
            aria-label="Mở bình luận bài viết"
          >
          <MessageCircle className="w-5 h-5" />
          <span className="hidden min-[380px]:inline">Bình luận</span>
          </button>

          <button
            onClick={() => setShowShareComposer(true)}
            disabled={shareMutation.isPending}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-hover disabled:opacity-50"
            aria-label="Chia sẻ bài viết"
          >
            {shareMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
            <span className="hidden min-[380px]:inline">Chia sẻ</span>
          </button>
        </div>

        {/* Comments Section */}
        {showComments && <CommentSection postId={post.id} />}
      </div>

      {/* Delete Confirmation Dialog */}
      <ShareComposer
        open={showShareComposer}
        post={post}
        isPending={shareMutation.isPending}
        onClose={() => setShowShareComposer(false)}
        onSubmit={handleShare}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setShowDeleteConfirm(false)}>
          <div
            className="bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 border border-border animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg text-foreground mb-2">Xóa bài viết?</h3>
            <p className="text-foreground/60 text-sm mb-6">Bài viết sẽ bị xóa vĩnh viễn và không thể khôi phục.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-hover hover:bg-border text-foreground font-semibold text-sm transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setShowReportConfirm(false)}>
          <div
            className="bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 border border-border animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg text-foreground mb-2">Báo cáo bài viết</h3>
            <p className="text-foreground/60 text-sm mb-4">Báo cáo sẽ gửi vào hàng chờ kiểm duyệt.</p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={3}
              className="mb-4 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Lý do báo cáo"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowReportConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-hover hover:bg-border text-foreground font-semibold text-sm transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleReportPost}
                disabled={reportMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {reportMutation.isPending ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showChatShare && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setShowChatShare(false)}>
          <div
            className="w-full max-w-md rounded-t-3xl border border-border bg-card p-4 shadow-2xl sm:mx-4 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Chia sẻ vào chat/nhóm</h3>
              <button onClick={() => setShowChatShare(false)} className="rounded-full px-3 py-1 text-sm text-muted-foreground hover:bg-hover">Đóng</button>
            </div>
            <div className="max-h-[60dvh] space-y-1 overflow-y-auto">
              {chatShareLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Đang tải...</div>
              ) : conversations.length > 0 ? conversations.map((conversation) => {
                const otherMember = conversation.type === 'DIRECT'
                  ? (conversation.members?.find((m: any) => m.userId !== user?.id) || conversation.otherMembers?.[0])
                  : null;
                const title = conversation.type === 'DIRECT'
                  ? (otherMember?.user?.fullName || conversation.title || 'Không tên')
                  : (conversation.title || conversation.name || 'Nhóm');
                const avatarFallback = title.charAt(0).toUpperCase() || 'C';
                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleShareToChat(conversation)}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left hover:bg-hover"
                  >
                    <Avatar src={conversation.avatarUrl || otherMember?.user?.avatarUrl} fallback={avatarFallback} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{title}</p>
                      <p className="truncate text-xs text-muted-foreground">Gửi link bài viết</p>
                    </div>
                  </button>
                );
              }) : (
                <div className="py-6 text-center text-sm text-muted-foreground">Chưa có cuộc trò chuyện</div>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
