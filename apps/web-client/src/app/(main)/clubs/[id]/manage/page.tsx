'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, BarChart3, Check, ChevronLeft, Crown, Loader2, Save, Search, Shield, Trash2, UserCog, UserMinus, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Club, UpdateClubPayload, useClub, useDeleteClub, useRemoveClubMember, useUpdateClub } from '@/hooks/useClubs';
import api from '@/lib/api';
import toast from 'react-hot-toast';

type JoinRequest = {
  id: string;
  createdAt: string;
  user: { id: string; fullName: string; avatarUrl?: string | null; major?: string | null; department?: string | null };
};

type ClubAnalytics = {
  members: number;
  pendingRequests: number;
  posts: number;
  newMembers7d: number;
  posts7d: number;
};

const withImageVersion = (url?: string | null, version?: string | null) => {
  if (!url) return '';
  if (!url.startsWith('/uploads/')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(version || '')}`;
};

export default function ClubManagePage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params.id as string;
  const queryClient = useQueryClient();
  const { data: club, isLoading, isError } = useClub(clubId);
  const [memberSearch, setMemberSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [form, setForm] = useState<UpdateClubPayload>({});

  const canManage = club?.myRole === 'OWNER' || club?.myRole === 'ADMIN';
  const isOwner = club?.myRole === 'OWNER';

  useEffect(() => {
    if (!club) return;
    setForm({
      name: club.name,
      description: club.description || '',
      category: club.category || '',
      type: club.type,
      visibility: club.visibility || 'PUBLIC',
      joinMode: club.joinMode || 'OPEN',
      rules: club.rules || '',
      location: club.location || '',
      contactEmail: club.contactEmail || '',
      tags: club.tags || [],
      socialLinks: club.socialLinks || {},
    });
  }, [club]);

  const { data: requests = [], isLoading: isRequestsLoading } = useQuery({
    queryKey: ['clubs', clubId, 'requests'],
    queryFn: async () => {
      const res = await api.get(`/clubs/${clubId}/requests`);
      return (res.data?.data ?? res.data) as JoinRequest[];
    },
    enabled: !!clubId && canManage,
  });

  const { data: analytics } = useQuery({
    queryKey: ['clubs', clubId, 'analytics'],
    queryFn: async () => {
      const res = await api.get(`/clubs/${clubId}/analytics`);
      return (res.data?.data ?? res.data) as ClubAnalytics;
    },
    enabled: !!clubId && canManage,
  });

  const refreshManageData = () => {
    queryClient.invalidateQueries({ queryKey: ['clubs', clubId] });
    queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'requests'] });
    queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'analytics'] });
  };

  const members = useMemo(() => {
    const keyword = memberSearch.trim().toLowerCase();
    const source = club?.members || [];
    if (!keyword) return source;
    return source.filter((member) => {
      const text = `${member.user?.fullName || ''} ${member.user?.major || ''} ${member.user?.department || ''} ${member.role}`.toLowerCase();
      return text.includes(keyword);
    });
  }, [club?.members, memberSearch]);

  const updateClub = useUpdateClub(clubId);
  const removeMember = useRemoveClubMember(clubId);
  const deleteClub = useDeleteClub();
  const logoUrl = withImageVersion(club?.logoUrl, club?.updatedAt);

  const requestMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: 'approve' | 'reject' }) => {
      const res = await api.post(`/clubs/${clubId}/requests/${requestId}/${action}`);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.action === 'approve' ? 'Đã duyệt thành viên' : 'Đã từ chối yêu cầu');
      refreshManageData();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không xử lý được yêu cầu'),
  });

  const roleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const res = await api.put(`/clubs/${clubId}/members/${memberId}/role`, { role });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Đã cập nhật vai trò');
      refreshManageData();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Không cập nhật được vai trò'),
  });

  const handleSaveSettings = () => {
    if (!form.name?.trim()) {
      toast.error('Tên CLB không được để trống');
      return;
    }

    updateClub.mutate(
      {
        ...form,
        tags: Array.isArray(form.tags) ? form.tags : [],
      },
      {
        onSuccess: () => {
          toast.success('Đã lưu cài đặt CLB');
          refreshManageData();
        },
        onError: (error: any) => toast.error(error?.response?.data?.message || 'Không lưu được cài đặt'),
      },
    );
  };

  const handleRemoveMember = (member: NonNullable<Club['members']>[number]) => {
    const name = member.user?.fullName || member.userId;
    if (!window.confirm(`Kick ${name} khỏi CLB?`)) return;
    removeMember.mutate(member.id, {
      onSuccess: () => {
        toast.success(`Đã kick ${name}`);
        refreshManageData();
      },
      onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể kick thành viên'),
    });
  };

  const handleDeleteClub = () => {
    if (!club || deleteConfirm !== club.name) {
      toast.error('Nhập đúng tên CLB để xác nhận giải tán');
      return;
    }
    deleteClub.mutate(club.id, {
      onSuccess: () => {
        toast.success('Đã giải tán CLB');
        router.push('/clubs');
      },
      onError: (error: any) => toast.error(error?.response?.data?.message || 'Không thể giải tán CLB'),
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !club) {
    return (
      <div className="max-w-[900px] w-full pb-20 pt-6 px-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">Không tìm thấy CLB</h1>
        <Link href="/clubs" className="text-primary hover:underline mt-4 inline-block">Quay lại danh sách</Link>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="max-w-[900px] w-full pb-20 pt-6 px-4">
        <Link href={`/clubs/${club.id}`} className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground font-semibold text-sm mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Quay lại CLB
        </Link>
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
          <Shield className="w-12 h-12 text-foreground/25 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-foreground mb-2">Bạn không có quyền quản trị CLB này</h1>
          <p className="text-foreground/60">Chỉ chủ CLB hoặc quản trị viên mới xem được trang quản trị.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] w-full pb-20 pt-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href={`/clubs/${club.id}`} className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground font-semibold text-sm mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Quay lại CLB
      </Link>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-black overflow-hidden">
            {logoUrl ? <Image src={logoUrl} alt={club.name} width={64} height={64} className="w-full h-full object-cover" unoptimized /> : club.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold text-foreground">Quản trị {club.name}</h1>
            <p className="text-foreground/60 text-sm mt-1">Cài đặt nhanh, thành viên và kiểm duyệt nội dung Club.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Duyệt yêu cầu tham gia</h2>
            {isRequestsLoading ? (
              <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>
            ) : requests.length > 0 ? (
              <div className="space-y-3">
                {requests.map((request) => (
                  <div key={request.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-background p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center font-bold text-primary">
                        {request.user.avatarUrl ? <Image src={request.user.avatarUrl} alt={request.user.fullName} width={44} height={44} className="w-full h-full object-cover" unoptimized /> : request.user.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{request.user.fullName}</p>
                        <p className="text-xs text-foreground/55 truncate">{request.user.major || request.user.department || 'Chưa có thông tin ngành'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => requestMutation.mutate({ requestId: request.id, action: 'approve' })}
                        disabled={requestMutation.isPending}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" /> Duyệt
                      </button>
                      <button
                        onClick={() => requestMutation.mutate({ requestId: request.id, action: 'reject' })}
                        disabled={requestMutation.isPending}
                        className="inline-flex items-center gap-1 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/15 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" /> Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-border bg-background p-6 text-center text-sm text-foreground/55">Chưa có yêu cầu chờ duyệt.</p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-bold text-foreground flex items-center gap-2"><UserCog className="w-5 h-5 text-primary" /> Thành viên & quyền hạn</h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35" />
                <input
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder="Tìm thành viên..."
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-background p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center font-bold text-primary">
                      {member.user?.avatarUrl ? <Image src={member.user.avatarUrl} alt={member.user.fullName} width={40} height={40} className="w-full h-full object-cover" unoptimized /> : member.user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">{member.user?.fullName || member.userId}</p>
                      <p className="text-xs text-foreground/55 truncate">Vai trò hiện tại: {member.role}</p>
                    </div>
                  </div>
                  {member.role === 'OWNER' ? (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary"><Crown className="w-3.5 h-3.5" /> Chủ CLB</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select
                        value={member.role}
                        disabled={roleMutation.isPending || (member.role === 'ADMIN' && club.myRole !== 'OWNER')}
                        onChange={(event) => roleMutation.mutate({ memberId: member.id, role: event.target.value })}
                        className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground disabled:opacity-50"
                      >
                        <option value="MEMBER">MEMBER</option>
                        <option value="MODERATOR">MODERATOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member)}
                        disabled={removeMember.isPending || (member.role === 'ADMIN' && club.myRole !== 'OWNER')}
                        className="inline-flex items-center gap-1 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/15 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <UserMinus className="w-4 h-4" /> Kick
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {members.length === 0 && (
                <p className="rounded-2xl border border-dashed border-border bg-background p-6 text-center text-sm text-foreground/55">Không tìm thấy thành viên.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-bold text-foreground">Cài đặt CLB</h2>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={updateClub.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {updateClub.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block sm:col-span-2">
                <span className="block text-sm font-bold text-foreground/80 mb-2">Tên CLB</span>
                <input value={form.name || ''} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary" />
              </label>
              <label className="block">
                <span className="block text-sm font-bold text-foreground/80 mb-2">Danh mục</span>
                <input value={form.category || ''} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary" />
              </label>
              <label className="block">
                <span className="block text-sm font-bold text-foreground/80 mb-2">Email liên hệ</span>
                <input value={form.contactEmail || ''} onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary" />
              </label>
              <label className="block">
                <span className="block text-sm font-bold text-foreground/80 mb-2">Quyền riêng tư</span>
                <select value={form.visibility || 'PUBLIC'} onChange={(event) => setForm((prev) => ({ ...prev, visibility: event.target.value as any }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary">
                  <option value="PUBLIC">PUBLIC</option>
                  <option value="PRIVATE">PRIVATE</option>
                  <option value="UNLISTED">UNLISTED</option>
                </select>
              </label>
              <label className="block">
                <span className="block text-sm font-bold text-foreground/80 mb-2">Cách tham gia</span>
                <select value={form.joinMode || 'OPEN'} onChange={(event) => setForm((prev) => ({ ...prev, joinMode: event.target.value as any }))} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary">
                  <option value="OPEN">OPEN</option>
                  <option value="APPROVAL">APPROVAL</option>
                  <option value="INVITE_ONLY">INVITE_ONLY</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-sm font-bold text-foreground/80 mb-2">Mô tả</span>
                <textarea value={form.description || ''} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} rows={4} className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary" />
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-sm font-bold text-foreground/80 mb-2">Nội quy</span>
                <textarea value={form.rules || ''} onChange={(event) => setForm((prev) => ({ ...prev, rules: event.target.value }))} rows={4} className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary" />
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-sm font-bold text-foreground/80 mb-2">Tags</span>
                <input value={(form.tags || []).join(', ')} onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 12) }))} placeholder="coding, cmc, student" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary" />
              </label>
            </div>
          </div>

          {isOwner && (
            <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-5 shadow-sm">
              <h2 className="mb-2 flex items-center gap-2 font-extrabold text-destructive"><AlertTriangle className="w-5 h-5" /> Vùng nguy hiểm</h2>
              <p className="mb-4 text-sm text-foreground/65">Giải tán CLB sẽ xoá CLB và dữ liệu liên quan khỏi danh sách. Hành động này không thể hoàn tác.</p>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-foreground/80">Nhập đúng tên CLB: <strong>{club.name}</strong></span>
                <input value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} className="w-full rounded-xl border border-destructive/25 bg-background px-4 py-3 text-foreground outline-none focus:border-destructive" />
              </label>
              <button
                type="button"
                onClick={handleDeleteClub}
                disabled={deleteClub.isPending || deleteConfirm !== club.name}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteClub.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Giải tán CLB
              </button>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Analytics nhỏ</h2>
            <div className="space-y-3 text-sm text-foreground/70">
              <div className="flex items-center justify-between"><span>Thành viên</span><strong className="text-foreground">{(analytics?.members ?? club.memberCount).toLocaleString('vi-VN')}</strong></div>
              <div className="flex items-center justify-between"><span>Yêu cầu chờ duyệt</span><strong className="text-foreground">{analytics?.pendingRequests ?? requests.length}</strong></div>
              <div className="flex items-center justify-between"><span>Bài viết</span><strong className="text-foreground">{analytics?.posts ?? 0}</strong></div>
              <div className="flex items-center justify-between"><span>Thành viên mới 7 ngày</span><strong className="text-foreground">{analytics?.newMembers7d ?? 0}</strong></div>
              <div className="flex items-center justify-between"><span>Bài mới 7 ngày</span><strong className="text-foreground">{analytics?.posts7d ?? 0}</strong></div>
              <div className="flex items-center justify-between"><span>Vai trò của bạn</span><strong className="text-foreground">{club.myRole}</strong></div>
              <div className="flex items-center justify-between"><span>Loại</span><strong className="text-foreground">{club.type === 'OFFICIAL_CLUB' ? 'Chính thức' : 'Cộng đồng'}</strong></div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-bold text-foreground mb-3">Task tiếp theo</h2>
            <ul className="space-y-2 text-sm text-foreground/65 list-disc pl-5">
              <li>Thông báo cho người được duyệt.</li>
              <li>Lịch sử thay đổi vai trò.</li>
              <li>Transfer ownership an toàn.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
