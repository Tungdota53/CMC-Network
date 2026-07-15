'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, Users, Calendar, MessageCircle, MoreVertical, Image as ImageIcon, CheckCircle, Loader2, Camera, Send, X } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { mapBackendPost } from '@/hooks/useFeed';
import { PostCard } from '@/components/feed/PostCard';
import toast from 'react-hot-toast';

export default function ClubDetailPage() {
  const params = useParams();
  const clubId = params.id as string;
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const postFileInputRef = useRef<HTMLInputElement>(null);
  const [postContent, setPostContent] = useState('');
  const [postFiles, setPostFiles] = useState<File[]>([]);

  const { data: c, isLoading, isError } = useQuery({
    queryKey: ['clubs', clubId],
    queryFn: async () => {
      const res = await api.get(`/clubs/${clubId}`);
      return res.data?.data || res.data || null;
    }
  });

  const membershipMutation = useMutation({
    mutationFn: async () => (c?.isJoined ? api.delete(`/clubs/${clubId}/join`) : api.post(`/clubs/${clubId}/join`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId] });
    },
  });

  const { data: posts = [], isLoading: isPostsLoading } = useQuery({
    queryKey: ['clubs', clubId, 'posts'],
    queryFn: async () => {
      const res = await api.get(`/posts/club/${clubId}?limit=20`);
      const data = res.data?.data ?? res.data;
      return (Array.isArray(data) ? data : []).map(mapBackendPost);
    },
    enabled: !!clubId,
  });

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const content = postContent.trim();
      if (!content && postFiles.length === 0) throw new Error('Bài viết không được để trống');
      const formData = new FormData();
      formData.append('clubId', clubId);
      if (content) formData.append('content', content);
      postFiles.forEach((file) => formData.append('files', file));
      const res = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      setPostContent('');
      setPostFiles([]);
      toast.success('Đã đăng bài trong CLB');
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'posts'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Không thể đăng bài');
    },
  });

  const uploadClubImage = useMutation({
    mutationFn: async ({ file, kind }: { file: File; kind: 'logo' | 'banner' }) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/clubs/${clubId}/${kind}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Đã cập nhật ảnh CLB');
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không thể cập nhật ảnh');
    },
  });

  const canManage = c?.myRole === 'OWNER' || c?.myRole === 'ADMIN';

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !c) {
    return (
      <div className="max-w-[1000px] w-full pb-20 pt-6 px-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">Không tìm thấy câu lạc bộ</h1>
        <Link href="/clubs" className="text-primary hover:underline mt-4 inline-block">Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] w-full pb-20 pt-4 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Banner */}
      <div className="relative mb-16 rounded-b-3xl overflow-visible">
        <Link href="/clubs" className="absolute top-4 left-4 z-10 w-10 h-10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        <div className="h-48 md:h-64 bg-gradient-to-r from-primary/80 via-purple-500/80 to-pink-500/80 rounded-3xl overflow-hidden shadow-inner relative">
           {c.bannerUrl && <Image src={c.bannerUrl} alt={c.name} fill sizes="100vw" className="object-cover" unoptimized />}
           {canManage && (
             <button
               type="button"
               onClick={() => bannerInputRef.current?.click()}
               disabled={uploadClubImage.isPending}
               className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-xl bg-black/45 px-3 py-2 text-sm font-bold text-white backdrop-blur-md hover:bg-black/60 disabled:opacity-60"
             >
               <Camera className="w-4 h-4" /> Sửa ảnh bìa
             </button>
           )}
        </div>

        {/* Logo overlapping banner */}
        <div className="absolute -bottom-12 left-8 flex items-end gap-5">
          <div className="relative w-24 h-24 rounded-2xl border-4 border-background bg-card shadow-md flex items-center justify-center text-4xl font-black text-primary bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
            {c.logoUrl ? <Image src={c.logoUrl} alt={c.name} fill sizes="96px" className="object-cover" unoptimized /> : c.name?.charAt(0) || 'C'}
            {canManage && (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadClubImage.isPending}
                className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/50 py-1 text-white hover:bg-black/65 disabled:opacity-60"
                aria-label="Sửa logo CLB"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="mb-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground flex items-center gap-2 drop-shadow-sm">
              {c.name}
              {c.isVerified && <CheckCircle className="w-6 h-6 text-blue-500 fill-blue-500" />}
            </h1>
            <p className="text-foreground/60 font-medium text-sm mt-1">{c.type === 'OFFICIAL_CLUB' ? 'Câu lạc bộ chính thức' : 'Cộng đồng tự do'} • {(c.memberCount || 0).toLocaleString('vi-VN')} thành viên</p>
          </div>
        </div>

        <input ref={bannerInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) uploadClubImage.mutate({ file, kind: 'banner' });
          event.currentTarget.value = '';
        }} />
        <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) uploadClubImage.mutate({ file, kind: 'logo' });
          event.currentTarget.value = '';
        }} />

        {/* Actions */}
        <div className="absolute -bottom-10 right-8 flex items-center gap-2">
          {c.isJoined ? (
            <button
              onClick={() => membershipMutation.mutate()}
              disabled={membershipMutation.isPending || c.myRole === 'OWNER'}
              className="px-5 py-2.5 bg-card text-foreground font-bold rounded-xl hover:bg-hover transition-colors text-sm border border-border shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {membershipMutation.isPending ? 'Đang xử lý...' : c.myRole === 'OWNER' ? 'Chủ CLB' : 'Đã tham gia'}
            </button>
          ) : c.myJoinRequestStatus === 'PENDING' ? (
            <button
              disabled
              className="px-5 py-2.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold rounded-xl text-sm border border-amber-500/25 shadow-sm disabled:cursor-not-allowed"
            >
              Chờ duyệt
            </button>
          ) : (
            <button
              onClick={() => membershipMutation.mutate()}
              disabled={membershipMutation.isPending}
              className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors text-sm shadow-sm disabled:opacity-60"
            >
              {membershipMutation.isPending ? 'Đang tham gia...' : c.joinMode === 'APPROVAL' ? 'Gửi yêu cầu tham gia' : 'Tham gia nhóm'}
            </button>
          )}
          {(c.myRole === 'OWNER' || c.myRole === 'ADMIN') && (
             <Link href={`/clubs/${c.id}/manage`} className="w-10 h-10 flex items-center justify-center bg-card border border-border text-foreground rounded-xl hover:bg-hover shadow-sm transition-colors">
               <MoreVertical className="w-5 h-5" />
             </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        {/* Main Feed/Content Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Create Post Composer */}
          {c.isJoined && (
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-border shrink-0"></div>
                <textarea
                  value={postContent}
                  onChange={(event) => setPostContent(event.target.value)}
                  placeholder={`Bạn muốn chia sẻ điều gì với ${c.name}?`}
                  rows={3}
                  className="flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-foreground/45 focus:outline-none focus:border-primary"
                />
              </div>

              {postFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 pl-0 sm:pl-13">
                  {postFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <span className="max-w-[160px] truncate">{file.name}</span>
                      <button type="button" onClick={() => setPostFiles((prev) => prev.filter((_, i) => i !== index))}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => postFileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-foreground/65 hover:bg-hover hover:text-primary transition-colors"
                >
                  <ImageIcon className="w-5 h-5" /> Thêm ảnh
                </button>
                <button
                  type="button"
                  onClick={() => createPostMutation.mutate()}
                  disabled={createPostMutation.isPending || (!postContent.trim() && postFiles.length === 0)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {createPostMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Đăng bài
                </button>
              </div>
              <input ref={postFileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple className="hidden" onChange={(event) => {
                const files = Array.from(event.target.files || []);
                setPostFiles((prev) => [...prev, ...files].slice(0, 10));
                event.currentTarget.value = '';
              }} />
            </div>
          )}

          {isPostsLoading ? (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-10 text-center text-foreground/50">
              <Loader2 className="w-7 h-7 animate-spin text-primary mx-auto" />
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => <PostCard key={post.id} post={post} onDeleted={() => queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'posts'] })} />)}
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6 text-center text-foreground/50 py-20">
              <MessageCircle className="w-12 h-12 text-foreground/20 mb-3 mx-auto" />
              <p className="font-medium">Chưa có bài viết nào trong CLB.</p>
              <p className="text-sm mt-1">{c.isJoined ? 'Hãy là người đầu tiên bắt đầu cuộc trò chuyện!' : 'Tham gia CLB để bắt đầu trò chuyện.'}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <h3 className="font-bold text-foreground mb-3">Giới thiệu</h3>
            <p className="text-sm text-foreground/70 leading-relaxed mb-4">{c.description || 'Chưa có thông tin giới thiệu'}</p>
            <div className="space-y-2 text-sm text-foreground/60">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" /> Bất kỳ ai cũng có thể tìm thấy nhóm này
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Quyền truy cập: {c.joinMode === 'OPEN' ? 'Tự do' : 'Phê duyệt'}
              </div>
              {c.createdAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Thành lập {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                </div>
              )}
              {c.owner?.fullName && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" /> Chủ CLB: {c.owner.fullName}
                </div>
              )}
            </div>
          </div>

          {Array.isArray(c.members) && c.members.length > 0 && (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
              <h3 className="font-bold text-foreground mb-4">Thành viên nổi bật</h3>
              <div className="space-y-3">
                {c.members.slice(0, 6).map((member: any) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold overflow-hidden">
                      {member.user?.avatarUrl ? <Image src={member.user.avatarUrl} alt="" width={36} height={36} className="w-full h-full object-cover" unoptimized /> : member.user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{member.user?.fullName || 'Thành viên'}</p>
                      <p className="text-xs text-foreground/50">{member.role === 'OWNER' ? 'Chủ CLB' : member.role === 'ADMIN' ? 'Quản trị' : 'Thành viên'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Events Mock */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-foreground">Sự kiện sắp tới</h3>
                <Link href="#" className="text-xs font-bold text-primary hover:underline">Xem tất cả</Link>
             </div>
             
             <div className="text-center py-4 text-sm text-foreground/50 border border-dashed border-border rounded-xl">
               <p>Chưa có sự kiện nào.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
