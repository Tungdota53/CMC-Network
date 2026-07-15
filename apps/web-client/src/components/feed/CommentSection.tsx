'use client';

import { useEffect, useMemo, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { useComments, useCreateComment, useLikeComment, useUnlikeComment, useReplies } from '@/hooks/useFeed';
import { ThumbsUp, CornerDownRight, Loader2 } from 'lucide-react';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes}p`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface CommentSectionProps {
  postId: string;
}

function CommentReplies({ commentId }: { commentId: string }) {
  const [enabled, setEnabled] = useState(false);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useReplies(commentId, enabled);
  const replies = data?.pages.flatMap((p: any) => p.replies) ?? [];

  if (!enabled) return null;

  return (
    <div className="mt-2 ml-4 space-y-2">
      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-foreground/50 py-1">
          <Loader2 className="w-3 h-3 animate-spin" /> Đang tải...
        </div>
      )}
      {replies.map((reply: any) => (
        <div key={reply.id} className="flex gap-2">
          <Avatar src={reply.user?.avatarUrl} fallback={reply.user?.fullName?.charAt(0)} size="sm" />
          <div className="flex-1">
            <div className="bg-hover rounded-2xl px-3 py-2">
              <p className="font-semibold text-[13px] text-foreground">{reply.user?.fullName}</p>
              <p className="text-[14px] text-foreground/90">{reply.content}</p>
            </div>
            <div className="flex gap-3 mt-1 ml-2 text-xs text-foreground/60">
              <span>{timeAgo(reply.createdAt)}</span>
              <button className="font-semibold hover:underline">Thích</button>
              {reply.likeCount > 0 && (
                <span className="flex items-center gap-0.5">
                  <ThumbsUp className="w-3 h-3" /> {reply.likeCount}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="text-xs font-semibold text-foreground/60 hover:underline ml-8"
        >
          {isFetchingNextPage ? 'Đang tải...' : 'Xem thêm phản hồi'}
        </button>
      )}
    </div>
  );
}

function CommentItem({ comment, postId, onReply }: { comment: any; postId: string; onReply: (id: string) => void }) {
  const [isLiked, setIsLiked] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(comment.likeCount || 0);
  const [showReplies, setShowReplies] = useState(false);
  const likeMutation = useLikeComment();
  const unlikeMutation = useUnlikeComment();

  const handleLike = async () => {
    if (isLiked) {
      setIsLiked(false);
      setLocalLikeCount((c: number) => c - 1);
      try { await unlikeMutation.mutateAsync(comment.id); }
      catch { setIsLiked(true); setLocalLikeCount((c: number) => c + 1); }
    } else {
      setIsLiked(true);
      setLocalLikeCount((c: number) => c + 1);
      try { await likeMutation.mutateAsync(comment.id); }
      catch { setIsLiked(false); setLocalLikeCount((c: number) => c - 1); }
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <Avatar src={comment.user?.avatarUrl} fallback={comment.user?.fullName?.charAt(0)} size="sm" />
        <div className="flex-1">
          <div className="bg-hover rounded-2xl px-3 py-2">
            <p className="font-semibold text-[13px] text-foreground">{comment.user?.fullName}</p>
            <p className="text-[14px] text-foreground/90">{comment.content}</p>
          </div>
          <div className="flex gap-3 mt-1 ml-2 text-xs text-foreground/60">
            <span>{timeAgo(comment.createdAt)}</span>
            <button
              onClick={handleLike}
              className={`font-semibold hover:underline ${isLiked ? 'text-primary' : ''}`}
            >
              Thích
            </button>
            <button
              onClick={() => onReply(comment.id)}
              className="font-semibold hover:underline"
            >
              Phản hồi
            </button>
            {localLikeCount > 0 && (
              <span className="flex items-center gap-0.5">
                <ThumbsUp className={`w-3 h-3 ${isLiked ? 'text-primary fill-primary' : ''}`} /> {localLikeCount}
              </span>
            )}
          </div>

          {/* Replies */}
          {comment.replyCount > 0 && !showReplies && (
            <div className="mt-2 ml-4">
              <button
                onClick={() => setShowReplies(true)}
                className="flex items-center gap-1 text-xs font-semibold text-foreground/60 hover:underline"
              >
                <CornerDownRight className="w-3 h-3" />
                Xem {comment.replyCount} phản hồi
              </button>
            </div>
          )}
          {showReplies && <CommentReplies commentId={comment.id} />}
        </div>
      </div>
    </div>
  );
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useComments(postId);
  const createComment = useCreateComment();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const draftKey = useMemo(() => `cmc:comment-draft:${postId}:${replyingTo ?? 'root'}`, [postId, replyingTo]);

  const comments = data?.pages.flatMap((p: any) => p.comments) ?? [];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setNewComment(window.localStorage.getItem(draftKey) ?? '');
  }, [draftKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (newComment.trim()) window.localStorage.setItem(draftKey, newComment);
    else window.localStorage.removeItem(draftKey);
  }, [draftKey, newComment]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    try {
      await createComment.mutateAsync({
        postId,
        content: newComment,
        parentId: replyingTo ?? undefined,
      });
      if (typeof window !== 'undefined') window.localStorage.removeItem(draftKey);
      setNewComment('');
      setReplyingTo(null);
    } catch (err) {
      console.error('Lỗi gửi bình luận:', err);
    }
  };

  return (
    <div className="border-t border-border px-4 py-3">
      {/* Comment Input */}
      <div className="flex gap-2 mb-3">
        <Avatar size="sm" />
        <div className="flex-1 flex items-center gap-2 bg-hover rounded-full px-3 py-1.5">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            placeholder={replyingTo ? 'Viết câu trả lời...' : 'Viết bình luận...'}
            className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-foreground/40"
          />
          {replyingTo && (
            <button onClick={() => setReplyingTo(null)} className="text-xs text-foreground/60 hover:text-foreground shrink-0">
              Hủy
            </button>
          )}
          {newComment.trim() && (
            <button
              onClick={handleSubmit}
              disabled={createComment.isPending}
              className="text-primary font-semibold text-sm shrink-0 hover:text-primary-hover disabled:opacity-50"
            >
              Gửi
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-foreground/40" />
        </div>
      )}

      {/* Comments */}
      <div className="space-y-3">
        {comments.map((comment: any) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            onReply={(id) => setReplyingTo(id)}
          />
        ))}
      </div>

      {/* Load more */}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mt-3 text-sm font-semibold text-foreground/60 hover:underline"
        >
          {isFetchingNextPage ? 'Đang tải...' : 'Xem thêm bình luận'}
        </button>
      )}
    </div>
  );
}
