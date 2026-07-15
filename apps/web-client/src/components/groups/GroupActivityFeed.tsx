'use client';

import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { ThumbsUp, MessageSquare, Share2, MoreHorizontal, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export function GroupActivityFeed({ title }: { title: string }) {
  const { user } = useAuthStore();
  
  const { data, isLoading } = useQuery({
    queryKey: ['group-feed'],
    queryFn: async () => {
      // Assuming a generic feed endpoint that can filter by group or just return group posts
      // For scaffold, we fetch normal feed or group specific feed.
      try {
        const response = await api.get('/feed', { params: { filter: 'groups' } });
        return response.data?.data?.items || response.data?.items || response.data || [];
      } catch (error) {
        return [];
      }
    }
  });

  const posts = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-4">
      <h2 className="text-[17px] font-bold text-foreground mb-2">{title}</h2>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-10 bg-card rounded-2xl border border-border">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : posts.length > 0 ? (
        posts.map((post: any) => (
          <div key={post.id} className="bg-card rounded-2xl shadow-sm border border-border p-4">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center font-bold text-white shadow-sm overflow-hidden">
                   {post.group?.avatarUrl ? (
                     <img src={post.group.avatarUrl} alt="" className="w-full h-full object-cover" />
                   ) : (
                     (post.group?.name || 'G').charAt(0)
                   )}
                </div>
                <div>
                  <p className="font-semibold text-[15px] leading-tight flex flex-wrap items-center gap-1.5">
                    <span className="text-foreground hover:underline cursor-pointer">{post.author?.fullName || 'Người dùng'}</span>
                    <span className="text-foreground/40 font-normal text-sm">▶</span>
                    <span className="text-foreground hover:underline cursor-pointer">{post.group?.name || 'Nhóm'}</span>
                  </p>
                  <div className="flex items-center gap-1 text-[12px] text-foreground/60 mt-0.5">
                    <span>
                      {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: vi }) : 'Vừa xong'}
                    </span>
                    <span>•</span>
                    <span>Thành viên</span>
                  </div>
                </div>
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-hover text-foreground/60 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            
            {/* Post Content */}
            <p className="text-[15px] text-foreground mb-4 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            
            {/* Stats */}
            <div className="flex items-center justify-between text-[13px] text-foreground/60 mb-3 px-1">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <ThumbsUp className="w-2.5 h-2.5 text-white" fill="currentColor" />
                </div>
                <span>{post.likesCount || 0}</span>
              </div>
              <div className="flex items-center gap-3">
                <span>{post.commentsCount || 0} bình luận</span>
                <span>{post.sharesCount || 0} lượt chia sẻ</span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center justify-between border-t border-border pt-1">
              <button className="flex-1 py-1.5 mt-1 flex items-center justify-center gap-2 hover:bg-hover rounded-lg text-foreground/60 font-semibold text-[14px] transition-colors">
                <ThumbsUp className="w-5 h-5" />
                Thích
              </button>
              <button className="flex-1 py-1.5 mt-1 flex items-center justify-center gap-2 hover:bg-hover rounded-lg text-foreground/60 font-semibold text-[14px] transition-colors">
                <MessageSquare className="w-5 h-5" />
                Bình luận
              </button>
              <button className="flex-1 py-1.5 mt-1 flex items-center justify-center gap-2 hover:bg-hover rounded-lg text-foreground/60 font-semibold text-[14px] transition-colors">
                <Share2 className="w-5 h-5" />
                Chia sẻ
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8 text-center">
          <p className="text-foreground/60">Chưa có hoạt động nào gần đây.</p>
        </div>
      )}
    </div>
  );
}
