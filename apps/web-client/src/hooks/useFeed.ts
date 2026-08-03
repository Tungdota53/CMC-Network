import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

// ============================================================
// Types
// ============================================================
export interface PostAuthor {
  id: string;
  fullName: string;
  profileSlug: string;
  avatarUrl: string | null;
  isVerified: boolean;
  hasBlueBadge?: boolean;
  faculty?: { name: string } | null;
}

export interface PostMedia {
  id: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'FILE';
  fileName: string | null;
  fileSize: number | null;
  displayOrder: number;
}

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  percentage: number;
  isVotedByUser: boolean;
}

export interface PostLinkPreview {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
}

export interface Post {
  id: string;
  content: string | null;
  type: 'TEXT' | 'PHOTO' | 'VIDEO' | 'POLL' | 'DOCUMENT' | 'LINK' | 'SHARE';
  visibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isPinned: boolean;
  isCommentLocked: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  media: PostMedia[];
  poll?: { id: string; question: string; options: PollOption[] } | null;
  linkPreview?: PostLinkPreview | null;
  sharedFrom?: Post | null;
  userReaction?: string | null;
  isSaved?: boolean;
}

export interface FeedResponse {
  posts: Post[];
  nextCursor: any | null;
}

function inferMediaType(mediaUrl: string, postType?: string): PostMedia['mediaType'] {
  if (postType === 'VIDEO' || /\.(mp4|webm|mov)(?:[?#]|$)/i.test(mediaUrl)) {
    return 'VIDEO';
  }
  return 'IMAGE';
}

export function mapBackendPost(post: any): Post {
  const mediaUrls: string[] = Array.isArray(post.mediaUrls) ? post.mediaUrls : [];
  const author = post.author ?? post.user ?? {};
  const authorSlug = author.profileSlug ?? author.studentId ?? author.id ?? post.userId;

  return {
    id: post.id,
    content: post.content ?? null,
    type: post.type === 'IMAGE' ? 'PHOTO' : (post.type || 'TEXT'),
    visibility: post.visibility || 'PUBLIC',
    likeCount: post.likeCount ?? post.likes ?? 0,
    commentCount: post.commentCount ?? post._count?.comments ?? 0,
    shareCount: post.shareCount ?? 0,
    isPinned: post.isPinned ?? false,
    isCommentLocked: post.isCommentLocked ?? post.commentLocked ?? false,
    tags: post.tags ?? [],
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: {
      id: author.id ?? post.userId,
      fullName: author.fullName ?? 'Người dùng',
      profileSlug: String(authorSlug).toLowerCase(),
      avatarUrl: author.avatarUrl ?? null,
      isVerified: author.isVerified ?? false,
      hasBlueBadge: author.hasBlueBadge ?? false,
    },
    media: (post.media ?? mediaUrls.map((mediaUrl, index) => ({ id: `${post.id}-${index}`, mediaUrl }))).map((media: any, index: number) => ({
      id: media.id ?? `${post.id}-${index}`,
      mediaUrl: media.mediaUrl ?? media.url,
      mediaType: media.mediaType ?? inferMediaType(media.mediaUrl ?? media.url, post.type),
      fileName: media.fileName ?? null,
      fileSize: media.fileSize ?? null,
      displayOrder: media.displayOrder ?? index,
    })),
    poll: post.poll ?? null,
    linkPreview: post.linkPreview ?? null,
    sharedFrom: post.sharedFrom ? mapBackendPost(post.sharedFrom) : null,
    userReaction: post.userReaction ?? post.likesRel?.[0]?.type ?? null,
    isSaved: post.isSaved ?? false,
  };
}

// ============================================================
// React Query hooks
// ============================================================

/** GET /feed — scored/ranked feed */
export function useFeed() {
  return useInfiniteQuery<FeedResponse>({
    queryKey: ['feed', 'trending'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get(`/feed?page=${pageParam}&limit=10`);
      const data = res.data.data;
      const posts = (Array.isArray(data) ? data : (data?.posts || [])).map(mapBackendPost);
      return {
        posts,
        nextCursor: posts.length === 10 ? (pageParam as number) + 1 : null,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

/** GET /feed/latest — chronological feed */
export function useLatestFeed() {
  return useInfiniteQuery<FeedResponse>({
    queryKey: ['feed', 'latest'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get(`/feed/latest?page=${pageParam}&limit=10`);
      const data = res.data.data;
      const posts = (Array.isArray(data) ? data : (data?.posts || [])).map(mapBackendPost);
      return {
        posts,
        nextCursor: posts.length === 10 ? (pageParam as number) + 1 : null,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

/** GET /posts/:id — chi tiết bài viết */
export function usePost(postId: string) {
  return useQuery<Post>({
    queryKey: ['post', postId],
    queryFn: async () => {
      const res = await api.get(`/posts/${encodeURIComponent(postId)}`);
      return mapBackendPost(res.data.data ?? res.data);
    },
    enabled: !!postId,
  });
}

/** POST /posts — tạo bài viết (hỗ trợ cả text thuần và upload file) */
export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      userId?: string;
      content?: string;
      type?: string;
      visibility?: string;
      tags?: string[];
      poll?: { question: string; options: string[]; isMultipleChoice?: boolean; expiresAt?: string };
      files?: File[];
    }) => {
      const { files, ...jsonData } = data;

      // Nếu có files → dùng FormData (multipart/form-data)
      if (files && files.length > 0) {
        const formData = new FormData();
        if (jsonData.userId) formData.append('userId', jsonData.userId);
        if (jsonData.content) formData.append('content', jsonData.content);
        if (jsonData.type) formData.append('type', jsonData.type);
        if (jsonData.visibility) formData.append('visibility', jsonData.visibility);
        if (jsonData.tags) jsonData.tags.forEach(tag => formData.append('tags', tag));
        files.forEach(file => formData.append('files', file));

        const res = await api.post('/posts', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
      }

      // Text-only / Poll → JSON
      const res = await api.post('/posts', jsonData);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

/** PUT /posts/:id — sửa bài viết */
export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, ...data }: { postId: string; content?: string; visibility?: string; tags?: string[] }) => {
      const res = await api.put(`/posts/${postId}`, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['post', variables.postId] });
    },
  });
}

/** DELETE /posts/:id — xóa bài viết */
export function useDeletePost() {
  const qc = useQueryClient();
  const user = useAuthStore((state) => state.user);
  return useMutation({
    mutationFn: async (postId: string) => {
      const endpoint = user?.role === 'ADMIN' ? `/posts/admin/${postId}` : `/posts/${postId}`;
      const res = await api.delete(endpoint);
      return res.data;
    },
    // Optimistic: xóa post khỏi mọi trang feed ngay lập tức
    onMutate: async (postId: string) => {
      await qc.cancelQueries({ queryKey: ['feed'] });
      const previousFeed = qc.getQueriesData({ queryKey: ['feed'] });

      qc.setQueriesData({ queryKey: ['feed'] }, (oldData: any) => {
        if (!oldData?.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            posts: (page.posts || []).filter((p: any) => p.id !== postId),
          })),
        };
      });

      return { previousFeed };
    },
    onError: (_err, _postId, context: any) => {
      // Khôi phục nếu xóa thất bại
      context?.previousFeed?.forEach(([key, data]: any) => {
        qc.setQueryData(key, data);
      });
    },
    onSettled: (_data, _error, postId) => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['post', postId] });
      qc.invalidateQueries({ queryKey: ['saved-posts'] });
    },
  });
}

/** POST /posts/:id/react — react bài viết */
export function useReactPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, reactionType }: { postId: string; reactionType: string }) => {
      const res = await api.post(`/posts/${postId}/react`, { reactionType });
      return res.data;
    },
    onMutate: async ({ postId, reactionType }) => {
      await qc.cancelQueries({ queryKey: ['feed'] });
      const previousFeed = qc.getQueriesData({ queryKey: ['feed'] });

      qc.setQueriesData({ queryKey: ['feed'] }, (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: Post) => {
              if (post.id === postId) {
                const oldReaction = post.userReaction;
                let newLikeCount = post.likeCount;
                if (!oldReaction) newLikeCount += 1;
                return { ...post, userReaction: reactionType, likeCount: newLikeCount };
              }
              return post;
            }),
          })),
        };
      });

      return { previousFeed };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousFeed) {
        context.previousFeed.forEach(([queryKey, data]: any) => qc.setQueryData(queryKey, data));
      }
    },
    onSettled: (_data, _error, variables) => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['post', variables.postId] });
    },
  });
}

/** DELETE /posts/:id/react — bỏ react */
export function useUnreactPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await api.delete(`/posts/${postId}/react`);
      return res.data;
    },
    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: ['feed'] });
      const previousFeed = qc.getQueriesData({ queryKey: ['feed'] });

      qc.setQueriesData({ queryKey: ['feed'] }, (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: Post) => {
              if (post.id === postId) {
                let newLikeCount = post.likeCount;
                if (post.userReaction) newLikeCount -= 1;
                return { ...post, userReaction: null, likeCount: newLikeCount };
              }
              return post;
            }),
          })),
        };
      });

      return { previousFeed };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousFeed) {
        context.previousFeed.forEach(([queryKey, data]: any) => qc.setQueryData(queryKey, data));
      }
    },
    onSettled: (_data, _error, postId) => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}

/** POST /posts/:id/save */
export function useSavePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await api.post(`/posts/${postId}/save`);
      return res.data;
    },
    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: ['feed'] });
      const previousFeed = qc.getQueriesData({ queryKey: ['feed'] });

      qc.setQueriesData({ queryKey: ['feed'] }, (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: Post) => {
              if (post.id === postId) {
                return { ...post, isSaved: true };
              }
              return post;
            }),
          })),
        };
      });

      return { previousFeed };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousFeed) {
        context.previousFeed.forEach(([queryKey, data]: any) => qc.setQueryData(queryKey, data));
      }
    },
    onSettled: (_data, _error, postId) => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['post', postId] });
      qc.invalidateQueries({ queryKey: ['saved-posts'] });
    },
  });
}

/** DELETE /posts/:id/save — bỏ lưu */
export function useUnsavePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await api.delete(`/posts/${postId}/save`);
      return res.data;
    },
    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: ['feed'] });
      const previousFeed = qc.getQueriesData({ queryKey: ['feed'] });

      qc.setQueriesData({ queryKey: ['feed'] }, (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: Post) => {
              if (post.id === postId) {
                return { ...post, isSaved: false };
              }
              return post;
            }),
          })),
        };
      });

      return { previousFeed };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousFeed) {
        context.previousFeed.forEach(([queryKey, data]: any) => qc.setQueryData(queryKey, data));
      }
    },
    onSettled: (_data, _error, postId) => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['post', postId] });
      qc.invalidateQueries({ queryKey: ['saved-posts'] });
    },
  });
}

/** POST /posts/:id/share */
export function useSharePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, content = '' }: { postId: string; content?: string }) => {
      const res = await api.post(`/posts/${postId}/share`, { content });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

/** POST /reports — báo cáo bài viết thật lên backend moderation */
export function useReportPost() {
  return useMutation({
    mutationFn: async ({ postId, reason }: { postId: string; reason: string }) => {
      const res = await api.post('/reports', {
        targetId: postId,
        targetType: 'POST',
        reason,
      });
      return res.data;
    },
  });
}

/** POST/DELETE /posts/:id/hide — ẩn bài viết theo user trên backend */
export function useHidePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await api.post(`/posts/${postId}/hide`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useUnhidePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await api.delete(`/posts/${postId}/hide`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}

/** PATCH /posts/:id/lock-comments */
export function useLockComments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, lock }: { postId: string; lock: boolean }) => {
      const res = await api.patch(`/posts/${postId}/lock-comments`, { lock });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['post', variables.postId] });
    },
  });
}

/** GET /posts/:id/comments */
export function useComments(postId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['comments', postId],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get(`/posts/${postId}/comments?page=${pageParam}&limit=10`);
      const data = res.data.data;
      const comments = Array.isArray(data) ? data : (data?.comments || []);
      return {
        comments,
        nextCursor: comments.length === 10 ? (pageParam as number) + 1 : null,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}

/** POST /posts/:id/comments */
export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) => {
      const res = await api.post(`/posts/${postId}/comments`, { content, parentId });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['comments', variables.postId] });
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['post', variables.postId] });
      if (variables.parentId) {
        qc.invalidateQueries({ queryKey: ['replies', variables.parentId] });
      }
    },
  });
}

/** POST /comments/:id/like */
export function useLikeComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      const res = await api.post(`/comments/${commentId}/like`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

/** DELETE /comments/:id/like */
export function useUnlikeComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      const res = await api.delete(`/comments/${commentId}/like`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

/** GET /comments/:id/replies */
export function useReplies(commentId: string, enabled = false) {
  return useInfiniteQuery({
    queryKey: ['replies', commentId],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get(`/comments/${commentId}/replies?page=${pageParam}&limit=10`);
      const data = res.data.data;
      const replies = Array.isArray(data) ? data : (data?.replies || []);
      return {
        replies,
        nextCursor: replies.length === 10 ? (pageParam as number) + 1 : null,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}

