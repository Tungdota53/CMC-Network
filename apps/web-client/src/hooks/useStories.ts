import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export interface Story {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'TEXT';
  mediaUrl?: string;
  thumbnailUrl?: string;
  textContent?: string;
  bgColor?: string;
  bgGradient?: string;
  fontStyle?: string;
  fontSize?: number;
  textAlign?: string;
  duration: number;
  createdAt: string;
  expiresAt?: string;
  isViewed: boolean;
  sharedPost?: {
    id: string;
    authorName: string;
    authorAvatarUrl?: string;
    hasBlueBadge?: boolean;
    content?: string;
    mediaUrl?: string;
  };
}

export interface StoryUserGroup {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  profileSlug: string;
  isVerified: boolean;
  hasBlueBadge: boolean;
  stories: Story[];
  hasUnviewed: boolean;
  latestStoryAt: string;
}

function mapStoryPost(post: any): Story {
  const mediaUrl = post.mediaUrls?.[0] || post.mediaUrl || '';
  let textMeta: any = null;
  let sharedPostMeta: Story['sharedPost'];
  if (typeof mediaUrl === 'string' && mediaUrl.startsWith('text-story:')) {
    try {
      textMeta = JSON.parse(decodeURIComponent(mediaUrl.slice('text-story:'.length)));
    } catch {
      textMeta = { textContent: post.content };
    }
  }
  if (typeof mediaUrl === 'string' && mediaUrl.startsWith('shared-post-story:')) {
    try {
      sharedPostMeta = JSON.parse(decodeURIComponent(mediaUrl.slice('shared-post-story:'.length)));
    } catch {
      sharedPostMeta = undefined;
    }
  }

  return {
    id: post.id,
    type: textMeta || sharedPostMeta
      ? 'TEXT'
      : /\.(mp4|webm|mov)(?:[?#]|$)/i.test(mediaUrl)
        ? 'VIDEO'
        : 'IMAGE',
    mediaUrl: textMeta ? undefined : mediaUrl,
    textContent: textMeta?.textContent || (sharedPostMeta ? undefined : post.content),
    bgGradient: textMeta?.bgGradient || (sharedPostMeta ? 'linear-gradient(145deg, #1877f2 0%, #7c3aed 52%, #ec4899 100%)' : undefined),
    duration: 5,
    createdAt: post.createdAt,
    expiresAt: post.expiresAt,
    isViewed: Boolean(post.seenByMe),
    sharedPost: sharedPostMeta,
  };
}

function groupStoryPosts(raw: any): { users: StoryUserGroup[] } {
  if (raw?.users) return raw;
  const posts = Array.isArray(raw) ? raw : raw?.data || [];
  const map = new Map<string, StoryUserGroup>();

  for (const post of posts) {
    const author = post.user || post.author || {};
    const userId = author.id || post.userId;
    if (!userId) continue;
    const group: StoryUserGroup = map.get(userId) || {
      userId,
      fullName: author.fullName || 'Người dùng',
      avatarUrl: author.avatarUrl || null,
      profileSlug: author.profileSlug || userId,
      isVerified: Boolean(author.isVerified),
      hasBlueBadge: Boolean(author.hasBlueBadge),
      stories: [],
      hasUnviewed: false,
      latestStoryAt: post.createdAt,
    };
    const story = mapStoryPost(post);
    group.stories.push(story);
    group.hasUnviewed = group.hasUnviewed || !story.isViewed;
    if (new Date(post.createdAt) > new Date(group.latestStoryAt)) {
      group.latestStoryAt = post.createdAt;
    }
    map.set(userId, group);
  }

  return { users: Array.from(map.values()) };
}

export function useStoriesFeed() {
  return useQuery<{ users: StoryUserGroup[] }>({
    queryKey: ['stories', 'feed'],
    queryFn: async () => {
      const res = await api.get('/stories/feed');
      return groupStoryPosts(res.data.data ?? res.data);
    },
  });
}

export function useMyStories() {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: ['stories', 'my', userId],
    queryFn: async () => {
      const res = await api.get('/stories/my');
      const raw = res.data.data ?? res.data;
      const posts = Array.isArray(raw) ? raw : raw?.data || [];
      return groupStoryPosts(
        posts.filter((post: any) => (post.user?.id || post.userId) === userId),
      );
    },
    enabled: Boolean(userId),
  });
}

export function useViewStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (storyId: string) => {
      const res = await api.post(`/stories/${storyId}/view`);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate feed to update gradient rings
      qc.invalidateQueries({ queryKey: ['stories', 'feed'] });
    },
  });
}

export function useDeleteStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ storyId, isAdmin }: { storyId: string; isAdmin: boolean }) => {
      const endpoint = isAdmin ? `/posts/admin/${storyId}` : `/posts/${storyId}`;
      const res = await api.delete(endpoint);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stories'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
