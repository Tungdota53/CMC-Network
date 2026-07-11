"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { apiFetch } from '../lib/api';
import Link from 'next/link';
import { SkeletonCard } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { StaggerContainer, StaggerItem, SlideUp } from '../components/ui/Motion';

type PostUser = {
  id?: string;
  fullName?: string;
  avatarUrl?: string | null;
  department?: string | null;
  isVerified?: boolean;
  role?: string;
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user?: PostUser;
  likeCount?: number;
  liked?: boolean;
};

type SharedFrom = {
  id?: string;
  content?: string;
  mediaUrls?: string[];
  user?: PostUser;
} | null;

type FeedPost = {
  id: string;
  userId: string;
  content: string;
  mediaUrls?: string[];
  likes: number;
  commentCount: number;
  shareCount: number;
  saveCount?: number;
  saved?: boolean;
  type?: string;
  sharedFrom?: SharedFrom;
  createdAt: string;
  updatedAt?: string;
  user?: PostUser;
  comments?: Comment[];
  _count?: { comments?: number };
  likesRel?: { userId: string; type: string }[];
};

const POSTS_API_URL = '/api';

const getAvatar = (user: PostUser | null | undefined, fallbackId: string) => {
  if (user?.avatarUrl) {
    return user.avatarUrl;
  }
  return `https://i.pravatar.cc/150?u=${fallbackId}`;
};

const getMediaUrl = (url: string) => url;

export default function Home() {
  const { user: currentUser } = useUser();
  const postFileInputRef = useRef<HTMLInputElement | null>(null);
  const storyFileInputRef = useRef<HTMLInputElement | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [stories, setStories] = useState<FeedPost[]>([]);
  const [newContent, setNewContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<{file: File, url: string}[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [isPostingStory, setIsPostingStory] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [viewingStory, setViewingStory] = useState<FeedPost | null>(null);
  const [sharingPost, setSharingPost] = useState<FeedPost | null>(null);
  const [shareContent, setShareContent] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const REACTIONS = [
    { type: 'LIKE', icon: '👍', label: 'Thích', color: 'text-blue-500' },
    { type: 'LOVE', icon: '❤️', label: 'Yêu thích', color: 'text-red-500' },
    { type: 'HAHA', icon: '😆', label: 'Haha', color: 'text-yellow-500' },
    { type: 'WOW', icon: '😮', label: 'Wow', color: 'text-yellow-500' },
    { type: 'SAD', icon: '😢', label: 'Buồn', color: 'text-yellow-500' },
    { type: 'ANGRY', icon: '😡', label: 'Phẫn nộ', color: 'text-orange-500' },
  ];

  const normalizePost = (post: FeedPost): FeedPost => ({
    ...post,
    mediaUrls: post.mediaUrls ?? [],
    commentCount: post.commentCount ?? post._count?.comments ?? 0,
    comments: post.comments ?? [],
  });

  const loadFeed = useCallback(async () => {
    setIsLoadingFeed(true);
    try {
      const response = await apiFetch(`${POSTS_API_URL}/posts/feed?page=1&limit=20`);
      if (!response.ok) return;

      const data = await response.json();
      setPosts(data.map((post: FeedPost) => ({
        ...post,
        commentCount: post.commentCount ?? post._count?.comments ?? 0,
        comments: post.comments ?? [],
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingFeed(false);
    }
  }, []);

  const loadStories = useCallback(async () => {
    const response = await apiFetch(`${POSTS_API_URL}/posts/stories`);
    if (!response.ok) return;

    const data = await response.json();
    setStories(data.map((post: FeedPost) => normalizePost(post)));
  }, []);

  useEffect(() => {
    window.setTimeout(() => {
      loadFeed().catch(console.error);
      loadStories().catch(console.error);
    }, 0);
  }, [loadFeed, loadStories]);

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiFetch(`${POSTS_API_URL}/posts/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Upload ảnh thất bại');
    const data = await response.json();
    return data.url as string;
  };

  const handlePostImages = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newImages = files.map(file => ({ file, url: URL.createObjectURL(file) }));
    setSelectedImages((prev) => [...prev, ...newImages]);
    if (postFileInputRef.current) postFileInputRef.current.value = '';
  };

  const removeImage = (indexToRemove: number) => {
    setSelectedImages((prev) => {
      const img = prev[indexToRemove];
      if (img) URL.revokeObjectURL(img.url);
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  useEffect(() => {
    return () => {
      // Cleanup object URLs on unmount to prevent memory leaks
      selectedImages.forEach(img => URL.revokeObjectURL(img.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePost = async () => {
    if (!newContent.trim() && selectedImages.length === 0) return;

    setIsPosting(true);
    try {
      const mediaUrls = await Promise.all(selectedImages.map((img) => uploadImage(img.file)));
      const response = await apiFetch(`${POSTS_API_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id || '', content: newContent || 'Đã thêm ảnh mới', mediaUrls }),
      });

      if (response.ok) {
        const newPost = normalizePost(await response.json());
        setPosts((prev) => [{ ...newPost, user: currentUser || undefined, comments: [] }, ...prev]);
        setNewContent('');
        selectedImages.forEach(img => URL.revokeObjectURL(img.url));
        setSelectedImages([]);
        if (postFileInputRef.current) postFileInputRef.current.value = '';
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleStoryFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsPostingStory(true);
    try {
      const mediaUrl = await uploadImage(file);
      const response = await apiFetch(`${POSTS_API_URL}/posts/stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id || '', mediaUrl, content: 'Story' }),
      });

      if (response.ok) {
        const story = normalizePost(await response.json());
        setStories((prev) => [{ ...story, user: currentUser || undefined }, ...prev]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPostingStory(false);
      if (storyFileInputRef.current) storyFileInputRef.current.value = '';
    }
  };

  const handleReaction = async (postId: string, type: string) => {
    setPosts((prev) => prev.map((post) => {
      if (post.id !== postId) return post;
      
      const userReactionIndex = post.likesRel?.findIndex((r) => r.userId === currentUser?.id);
      const likesRel = [...(post.likesRel || [])];
      let likesCount = post.likes || 0;
      
      if (userReactionIndex !== undefined && userReactionIndex !== -1) {
        if (likesRel[userReactionIndex].type === type) {
          likesRel.splice(userReactionIndex, 1);
          likesCount = Math.max(likesCount - 1, 0);
        } else {
          likesRel[userReactionIndex].type = type;
        }
      } else {
        likesRel.push({ userId: currentUser?.id || '', type });
        likesCount += 1;
      }
      
      return { ...post, likes: likesCount, likesRel };
    }));

    try {
      await apiFetch(`${POSTS_API_URL}/posts/${postId}/like`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id || '', type }),
      });
    } catch (e) {
      console.error('Lỗi khi thả biểu tượng cảm xúc:', e);
    }
  };

  const startEdit = (post: FeedPost) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
    setMenuOpenId(null);
  };

  const saveEdit = async (postId: string) => {
    try {
      const response = await apiFetch(`${POSTS_API_URL}/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id, content: editContent })
      });
      if (response.ok) {
        setPosts((prev) => prev.map(p => p.id === postId ? { ...p, content: editContent } : p));
      }
    } catch (e) {
      console.error(e);
    }
    setEditingPostId(null);
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser?.id) return;

    const response = await apiFetch(`${POSTS_API_URL}/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id }),
    });

    if (response.ok) {
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      setStories((prev) => prev.filter((story) => story.id !== postId));
      setMenuOpenId(null);
    }
  };

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    const response = await apiFetch(`${POSTS_API_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser?.id || '', content }),
    });

    if (!response.ok) return;

    const comment = await response.json();
    setPosts((prev) => prev.map((post) => post.id === postId ? {
      ...post,
      comments: [...(post.comments || []), { ...comment, user: comment.user || currentUser }],
      commentCount: (post.commentCount || 0) + 1,
    } : post));
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    setOpenComments((prev) => ({ ...prev, [postId]: true }));
  };

  // BE-006: toggle lưu bài viết -> POST /posts/:id/save -> { saved }
  const handleToggleSave = async (post: FeedPost) => {
    if (!currentUser?.id) return;
    const optimistic = !post.saved;
    setPosts((prev) => prev.map((p) => (p.id === post.id
      ? { ...p, saved: optimistic, saveCount: Math.max(0, (p.saveCount ?? 0) + (optimistic ? 1 : -1)) }
      : p)));
    try {
      const res = await apiFetch(`/posts/${post.id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, saved: data.saved } : p)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // BE-006: chia sẻ bài viết -> POST /posts/:id/share body { content? } -> Post mới (type SHARE)
  const handleShare = async () => {
    if (!currentUser?.id || !sharingPost) return;
    setIsSharing(true);
    try {
      const res = await apiFetch(`/posts/${sharingPost.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, content: shareContent.trim() || undefined }),
      });
      if (res.ok) {
        const shared = normalizePost(await res.json());
        setPosts((prev) => prev.map((p) => (p.id === sharingPost.id ? { ...p, shareCount: (p.shareCount || 0) + 1 } : p)));
        setPosts((prev) => [{ ...shared, user: shared.user || currentUser || undefined, comments: [] }, ...prev]);
        setSharingPost(null);
        setShareContent('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSharing(false);
    }
  };

  // BE-006: thích bình luận -> POST /posts/comments/:commentId/like -> { liked }
  const handleCommentLike = async (postId: string, comment: Comment) => {
    if (!currentUser?.id) return;
    const optimistic = !comment.liked;
    setPosts((prev) => prev.map((p) => (p.id !== postId ? p : {
      ...p,
      comments: (p.comments || []).map((c) => (c.id === comment.id
        ? { ...c, liked: optimistic, likeCount: Math.max(0, (c.likeCount ?? 0) + (optimistic ? 1 : -1)) }
        : c)),
    })));
    try {
      const res = await apiFetch(`/posts/comments/${comment.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) => prev.map((p) => (p.id !== postId ? p : {
          ...p,
          comments: (p.comments || []).map((c) => (c.id === comment.id ? { ...c, liked: data.liked } : c)),
        })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full flex flex-col items-center mx-auto gap-2 sm:gap-4 sm:bg-transparent">
      <div className="w-full flex gap-2 overflow-x-auto no-scrollbar py-3 px-3 glass rounded-none sm:rounded-xl border-x-0 sm:border-x">
        <button
          onClick={() => storyFileInputRef.current?.click()}
          disabled={isPostingStory}
          className="relative w-28 h-48 sm:w-36 sm:h-56 shrink-0 glass rounded-xl overflow-hidden cursor-pointer group hover:shadow-[0_4px_20px_rgba(99,102,241,0.1)] transition-all text-left disabled:opacity-60 border border-slate-200 dark:border-slate-700"
        >
          <div className="h-[65%] w-full overflow-hidden">
            <img src={getAvatar(currentUser, currentUser?.id || 'me')} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" alt="" />
          </div>
          <div className="absolute top-[55%] left-1/2 -translate-x-1/2 w-11 h-11 bg-indigo-600 rounded-full border-4 border-white flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/20">+</div>
          <p className="text-center text-[13px] font-semibold mt-7 text-slate-700">{isPostingStory ? 'Đang đăng...' : 'Tạo tin'}</p>
        </button>
        <input ref={storyFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleStoryFile} />

        {stories.map((story) => (
          <div key={story.id} onClick={() => setViewingStory(story)} className="relative w-28 h-48 sm:w-36 sm:h-56 shrink-0 glass rounded-xl overflow-hidden cursor-pointer group hover:shadow-[0_4px_20px_rgba(99,102,241,0.1)] border border-slate-200 dark:border-slate-700 transition-all">
            <img src={getMediaUrl(story.mediaUrls?.[0] || '')} className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-3 left-3 w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 to-purple-500">
              <div className="w-full h-full rounded-full border-2 border-white overflow-hidden">
                <img src={getAvatar(story.user, story.userId)} className="w-full h-full object-cover" alt="" />
              </div>
            </div>
            <p className="absolute bottom-3 left-3 right-3 text-white text-[12px] font-semibold leading-tight drop-shadow-md truncate">{story.user?.fullName || 'Story'}</p>
          </div>
        ))}
      </div>

      <SlideUp y={10} className="w-full glass rounded-none sm:rounded-xl p-4 sm:p-5 mb-4 border-x-0 sm:border-x flex flex-col gap-4 shadow-sm z-10 relative">
        <div className="flex gap-3 relative z-10 items-start">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
            <img src={getAvatar(currentUser, currentUser?.id || 'me')} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 flex flex-col">
            <textarea
              value={newContent}
              onChange={(event) => {
                if (event.target.value.length <= 2000) {
                  setNewContent(event.target.value);
                }
              }}
              placeholder={`Có gì mới không ${currentUser?.fullName ? currentUser.fullName.split(' ').pop() : 'bạn'}?`}
              className="w-full bg-transparent outline-none text-token-primary placeholder-token-tertiary text-[15px] resize-none min-h-[60px] max-h-[200px] overflow-y-auto no-scrollbar pt-2"
              rows={Math.max(2, Math.min(6, newContent.split('\n').length))}
            />
            {newContent.length > 0 && (
              <div className="text-right text-[11px] font-medium mt-1 transition-colors text-token-tertiary">
                <span className={newContent.length >= 1900 ? 'text-red-500' : ''}>{newContent.length}</span> / 2000
              </div>
            )}
          </div>
        </div>

        {selectedImages.length > 0 && (
          <div className="relative z-10 grid grid-cols-2 gap-2 mb-2 pl-12 pr-2">
            {selectedImages.map((img, index) => (
              <div key={img.url} className="relative group/preview rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <img src={img.url} className="h-32 w-full object-cover" alt="Preview" />
                <button 
                  onClick={() => removeImage(index)} 
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-all duration-200 shadow-md backdrop-blur-sm"
                  title="Gỡ ảnh"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-1 pl-12 relative z-10">
          <div className="flex items-center gap-1">
            <button className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-colors text-token-secondary" title="Phát trực tiếp">
              <span className="text-[18px]">📹</span>
            </button>
            <button onClick={() => postFileInputRef.current?.click()} className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-colors text-token-secondary" title="Đính kèm ảnh">
              <span className="text-[18px]">🖼️</span>
            </button>
            <button className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-colors text-token-secondary" title="Cảm xúc">
              <span className="text-[18px]">😊</span>
            </button>
            <input ref={postFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePostImages} />
          </div>

          <button 
            onClick={handlePost} 
            disabled={isPosting || (!newContent.trim() && selectedImages.length === 0)} 
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400 text-white px-5 py-1.5 rounded-full text-[14px] font-semibold transition-all shadow-md shadow-indigo-500/20 disabled:shadow-none"
          >
            {isPosting ? 'Đang đăng...' : 'Đăng bài'}
          </button>
        </div>
      </SlideUp>

      {isLoadingFeed ? (
        <div className="w-full space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon="📝"
          title="Chưa có bài viết nào"
          description="Hãy là người đầu tiên chia sẻ điều thú vị cùng cộng đồng CMC."
        />
      ) : null}

      <StaggerContainer delayChildren={0.1} staggerChildren={0.1} className="w-full flex flex-col gap-4">
      {posts.map((post) => (
        <StaggerItem key={post.id} className="w-full glass rounded-none sm:rounded-xl border-x-0 sm:border-x mb-2 sm:mb-0">
          <div className="flex justify-between items-start p-5">
            <div className="flex items-center gap-2">
              <Link href={`/profile/${post.userId}`} className="relative group/avatar cursor-pointer">
                <div className="w-10 h-10 rounded-full overflow-hidden z-10 relative">
                  <img src={getAvatar(post.user, post.userId)} className="w-full h-full object-cover" alt="" />
                </div>
              </Link>
              <div>
                <Link href={`/profile/${post.userId}`} className="font-semibold text-[15px] text-token-primary hover:text-indigo-600 transition-colors leading-tight flex items-center">
                  {post.user?.fullName?.replace(' ✓', '')?.replace('✓', '') || 'Người dùng ẩn danh'}
                  {(post.user?.role === 'ADMIN' || post.user?.isVerified || post.user?.fullName?.includes('✓')) && (
                    <VerifiedBadge size={14} className="shrink-0 ml-0.5" />
                  )}
                </Link>
                <div className="text-[13px] text-token-secondary flex items-center gap-1 mt-0.5">
                  <span className="font-medium hover:underline cursor-pointer">{post.user?.department || 'Thành viên'}</span>
                  <span>·</span>
                  <span className="hover:underline cursor-pointer">{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                  <span>·</span>
                  <span className="text-[12px]">🌎</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div onClick={() => setMenuOpenId(menuOpenId === post.id ? null : post.id)} className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer text-token-secondary transition-colors">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M6 12a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              {menuOpenId === post.id && (
                <div className="absolute right-0 mt-2 w-48 surface border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden z-50 p-1 glass">
                  {post.userId === currentUser?.id ? (
                    <>
                      <button onClick={() => startEdit(post)} className="w-full text-left px-3 py-2 text-[13px] font-medium text-token-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">✏️ Chỉnh sửa bài viết</button>
                      <button onClick={() => handleDeletePost(post.id)} className="w-full text-left px-3 py-2 text-[13px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">🗑️ Xóa bài viết</button>
                    </>
                  ) : (
                    <button className="w-full text-left px-3 py-2 text-[13px] font-medium text-token-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">🚩 Báo cáo bài viết</button>
                  )}
                </div>
              )}
            </div>
          </div>

          {editingPostId === post.id ? (
            <div className="px-5 pb-4">
              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full surface-subtle border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-token-primary text-[14px] outline-none min-h-[100px] mb-3 focus:border-indigo-400" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditingPostId(null)} className="px-4 py-1.5 rounded-lg surface-subtle hover:bg-slate-200 dark:hover:bg-slate-700 text-token-secondary text-sm font-medium transition-colors">Hủy</button>
                <button onClick={() => saveEdit(post.id)} className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors">Lưu</button>
              </div>
            </div>
          ) : (
            <div className="px-4 pb-3 text-token-primary text-[15px] leading-snug">
              <p>{post.content} {post.updatedAt && post.updatedAt !== post.createdAt && <span className="text-[11px] text-token-tertiary ml-1 font-normal italic">(Đã chỉnh sửa)</span>}</p>
            </div>
          )}

          {(post.mediaUrls || []).length > 0 && (
            <div className={`w-full grid gap-1 mt-2 px-1 ${
              post.mediaUrls!.length === 1 ? 'grid-cols-1' :
              post.mediaUrls!.length === 2 ? 'grid-cols-2' :
              post.mediaUrls!.length === 3 ? 'grid-cols-2 grid-rows-2' :
              'grid-cols-2 grid-rows-2'
            }`}>
              {post.mediaUrls!.slice(0, 4).map((url, i) => (
                <div key={url} className={`relative overflow-hidden ${post.mediaUrls!.length === 3 && i === 0 ? 'col-span-2' : ''} ${post.mediaUrls!.length === 1 ? 'rounded-xl mx-3' : i === 0 ? 'rounded-tl-xl' : i === 1 ? 'rounded-tr-xl' : i === 2 ? 'rounded-bl-xl' : 'rounded-br-xl'}`}>
                  <img src={getMediaUrl(url)} className={`w-full object-cover transition-transform duration-500 hover:scale-105 cursor-pointer ${post.mediaUrls!.length === 1 ? 'max-h-[600px]' : 'h-64'}`} alt="" />
                  {post.mediaUrls!.length > 4 && i === 3 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-3xl font-bold cursor-pointer hover:bg-black/50 transition-colors">
                      +{post.mediaUrls!.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {post.sharedFrom && (
            <div className="px-5 pb-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 surface-subtle overflow-hidden">
                <div className="flex items-center gap-2 p-3">
                  <img src={getAvatar(post.sharedFrom.user, post.sharedFrom.user?.id || post.sharedFrom.id || post.id)} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" alt="" />
                  <span className="text-[13px] font-semibold text-token-primary">{post.sharedFrom.user?.fullName || 'Bài viết gốc'}</span>
                </div>
                {post.sharedFrom.content && <p className="px-3 pb-3 text-[13px] text-token-secondary leading-relaxed">{post.sharedFrom.content}</p>}
                {(post.sharedFrom.mediaUrls || []).length > 0 && (
                  <img src={getMediaUrl(post.sharedFrom.mediaUrls![0])} className="w-full max-h-[360px] object-cover" alt="" />
                )}
              </div>
            </div>
          )}

          <div className="px-4 py-2.5 flex justify-between items-center text-token-secondary text-[15px] border-b border-slate-200 dark:border-slate-700">
            <button className="flex items-center gap-1.5 cursor-pointer hover:underline">
              <div className="flex items-center">
                <span className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] z-10">👍</span>
                {post.likes > 0 && <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] -ml-1 z-0">❤️</span>}
              </div>
              <span>{post.likes || 0}</span>
            </button>
            <div className="flex gap-3 text-[14px]">
              <button onClick={() => setOpenComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))} className="hover:underline">{post.commentCount || 0} bình luận</button>
              <span className="hover:underline">{post.shareCount || 0} chia sẻ</span>
            </div>
          </div>

          <div className="px-3 py-1 flex justify-between items-center text-token-secondary font-semibold text-[14px]">
            {(() => {
              const userReaction = post.likesRel?.find(r => r.userId === currentUser?.id);
              const reactionDef = userReaction ? REACTIONS.find(r => r.type === userReaction.type) || REACTIONS[0] : null;

              return (
                <div className="relative group/reaction flex-1 flex">
                  <button onClick={() => handleReaction(post.id, userReaction?.type === 'LIKE' ? 'LIKE' : 'LIKE')} className={`flex-1 flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 py-2 rounded-lg cursor-pointer transition-colors ${reactionDef ? reactionDef.color : ''}`}>
                    <span className="text-[18px]">{reactionDef ? reactionDef.icon : '👍'}</span>
                    <span>{reactionDef ? reactionDef.label : 'Thích'}</span>
                  </button>
                  
                  <div className="absolute bottom-full left-4 mb-2 hidden group-hover/reaction:flex surface border border-slate-200 dark:border-slate-700 rounded-full p-2 shadow-xl gap-3 z-50">
                    {REACTIONS.map(r => (
                      <motion.button 
                        key={r.type} 
                        onClick={(e) => { e.stopPropagation(); handleReaction(post.id, r.type); }} 
                        className="text-2xl origin-bottom"
                        whileHover={{ scale: 1.35, y: -4 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {r.icon}
                      </motion.button>
                    ))}
                  </div>
                </div>
              );
            })()}

            <button onClick={() => setOpenComments((prev) => ({ ...prev, [post.id]: true }))} className="flex-1 flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 py-2 rounded-lg cursor-pointer transition-colors">
              <span className="text-[18px]">💬</span>
              <span>Bình luận</span>
            </button>
            <button onClick={() => { setSharingPost(post); setShareContent(''); }} className="flex-1 flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 py-2 rounded-lg cursor-pointer transition-colors">
              <span className="text-[18px]">🔗</span>
              <span>Chia sẻ</span>
            </button>
          </div>

          {openComments[post.id] && (
            <div className="px-5 pb-5 pt-1 border-t border-slate-200 dark:border-slate-700">
              <div className="space-y-3 py-3">
                {(post.comments || []).map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <img src={getAvatar(comment.user, comment.id)} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" alt="" />
                    <div className="flex flex-col items-start max-w-[85%]">
                      <div className="surface-subtle border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2">
                        <p className="text-[12px] font-semibold text-token-primary">{comment.user?.fullName || 'Người dùng'}</p>
                        <p className="text-[13px] text-token-primary leading-tight mt-0.5">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] font-medium text-token-tertiary">
                        <button onClick={() => handleCommentLike(post.id, comment)} className={`hover:underline cursor-pointer flex items-center gap-1 ${comment.liked ? 'text-rose-500 font-bold' : 'hover:text-token-primary'}`}>
                          <span>Thích</span>
                          {(comment.likeCount ?? 0) > 0 && <span className="flex items-center gap-0.5"><span className="text-[9px]">❤️</span>{comment.likeCount}</span>}
                        </button>
                        <button className="hover:underline hover:text-token-primary cursor-pointer">Phản hồi</button>
                        <span>{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 mt-2">
                <img src={getAvatar(currentUser, currentUser?.id || 'me')} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" alt="" />
                <div className="flex-1 relative flex items-center">
                  <input
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                    placeholder="Viết bình luận..."
                    className="w-full surface-subtle border border-slate-200 dark:border-slate-700 rounded-full py-2 pl-4 pr-10 text-[13px] text-token-primary placeholder-token-tertiary outline-none focus:border-indigo-400 focus:surface transition-all"
                  />
                  <button onClick={() => handleComment(post.id)} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 transition-colors">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </StaggerItem>
      ))}
      </StaggerContainer>

      {viewingStory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/95 backdrop-blur-md">
          <button onClick={() => setViewingStory(null)} className="absolute top-5 right-5 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white text-2xl transition-colors z-50">✕</button>
          <div className="relative max-w-md w-full h-[85vh] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col border border-white/10">
            <img src={getMediaUrl(viewingStory.mediaUrls?.[0] || '')} className="absolute inset-0 w-full h-full object-contain bg-zinc-950" alt="Story" />
            
            <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-zinc-950/80 to-transparent flex items-center gap-3">
              <img src={getAvatar(viewingStory.user, viewingStory.userId)} className="w-10 h-10 rounded-full border-2 border-indigo-500 object-cover shadow-md" alt="" />
              <div className="text-white">
                <p className="font-semibold text-[14px] drop-shadow-md">{viewingStory.user?.fullName || 'Người dùng'}</p>
                <p className="text-[11px] opacity-80 drop-shadow-md">{new Date(viewingStory.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-zinc-950/90 via-zinc-950/50 to-transparent">
              <p className="text-white text-center text-[15px] font-medium drop-shadow-md">{viewingStory.content !== 'Story' ? viewingStory.content : ''}</p>
            </div>
          </div>
        </div>
      )}

      {sharingPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => !isSharing && setSharingPost(null)}>
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-[15px] font-bold text-slate-800">Chia sẻ bài viết</h3>
              <button onClick={() => setSharingPost(null)} disabled={isSharing} className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <textarea
                value={shareContent}
                onChange={(e) => setShareContent(e.target.value)}
                placeholder="Viết gì đó về bài chia sẻ này (không bắt buộc)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-[14px] outline-none min-h-[90px] focus:border-indigo-400 transition-colors"
              />
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <img src={getAvatar(sharingPost.user, sharingPost.userId)} className="w-8 h-8 rounded-full object-cover border border-slate-200" alt="" />
                  <span className="text-[13px] font-semibold text-slate-800">{sharingPost.user?.fullName || 'Người dùng'}</span>
                </div>
                <p className="text-[13px] text-slate-600 line-clamp-3 leading-relaxed">{sharingPost.content}</p>
              </div>
              <button onClick={handleShare} disabled={isSharing} className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 py-2.5 text-[14px] text-white font-semibold transition-colors shadow-lg shadow-indigo-500/20">
                {isSharing ? 'Đang chia sẻ...' : 'Chia sẻ ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
