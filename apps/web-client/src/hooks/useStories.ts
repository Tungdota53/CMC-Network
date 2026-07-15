import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

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
  if (typeof mediaUrl === 'string' && mediaUrl.startsWith('text-story:')) {
    try {
      textMeta = JSON.parse(decodeURIComponent(mediaUrl.slice('text-story:'.length)));
    } catch {
      textMeta = { textContent: post.content };
    }
  }

  return {
    id: post.id,
    type: textMeta ? 'TEXT' : 'IMAGE',
    mediaUrl: textMeta ? undefined : mediaUrl,
    textContent: textMeta?.textContent || post.content,
    bgGradient: textMeta?.bgGradient,
    duration: 5,
    createdAt: post.createdAt,
    expiresAt: post.expiresAt,
    isViewed: Boolean(post.seenByMe),
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
  return useQuery({
    queryKey: ['stories', 'my'],
    queryFn: async () => {
      const res = await api.get('/stories/my');
      return groupStoryPosts(res.data.data ?? res.data);
    },
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
