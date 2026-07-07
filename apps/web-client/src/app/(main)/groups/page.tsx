"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { useUser } from '../../contexts/UserContext';
import { SkeletonGridCard } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

type StudyGroup = {
  id: string;
  title: string;
  subject: string;
  description?: string | null;
  location: string;
  memberCount: number;
  maxMembers: number;
  scheduledTime?: string;
  schedule?: string | null;
  status?: string;
  creatorId?: string;
  joinRequestStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null;
  creator?: { id?: string; fullName?: string; avatarUrl?: string | null };
};

type JoinRequest = {
  id: string;
  userId?: string;
  createdAt?: string;
  user?: { id?: string; fullName?: string; avatarUrl?: string | null };
  requester?: { id?: string; fullName?: string; avatarUrl?: string | null };
  status?: string;
};

const initialForm = {
  title: '',
  subject: '',
  description: '',
  location: '',
  maxMembers: 5,
  scheduledTime: '',
  schedule: '',
};

const getAvatar = (group: StudyGroup) => group.creator?.avatarUrl || `https://i.pravatar.cc/150?u=${group.id}`;

export default function GroupsPage() {
  const { user } = useUser();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [managingGroupId, setManagingGroupId] = useState<string | null>(null);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiFetch('/study-groups');
      if (!response.ok) throw new Error('Không thể tải nhóm học tập');
      setGroups(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải nhóm học tập');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadGroups(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadGroups]);

  const filteredGroups = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return groups;
    return groups.filter((group) => [group.title, group.subject, group.location].some((value) => value?.toLowerCase().includes(keyword)));
  }, [groups, searchQuery]);

  const handleCreate = async () => {
    if (!user?.id || !form.title.trim() || !form.subject.trim() || !form.location.trim() || !form.scheduledTime) return;

    setSaving(true);
    setError('');
    try {
      const response = await apiFetch('/study-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, creatorId: user.id, maxMembers: Number(form.maxMembers) }),
      });
      if (!response.ok) throw new Error('Không thể tạo nhóm học tập');
      const created = await response.json();
      setGroups((prev) => [created, ...prev]);
      setForm(initialForm);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo nhóm học tập');
    } finally {
      setSaving(false);
    }
  };

  // FE-001: gửi yêu cầu tham gia -> POST /study-groups/:id/join-requests (kèm userId trong compat window — BE-003)
  const handleJoin = async (group: StudyGroup) => {
    if (!user?.id || group.memberCount >= group.maxMembers) return;
    setActingId(group.id);
    setError('');
    try {
      const response = await apiFetch(`/study-groups/${group.id}/join-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!response.ok) throw new Error('Không thể gửi yêu cầu tham gia');
      setGroups((prev) => prev.map((g) => (g.id === group.id ? { ...g, joinRequestStatus: 'PENDING' } : g)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi yêu cầu tham gia');
    } finally {
      setActingId(null);
    }
  };

  // FE-001: trưởng nhóm xóa nhóm -> DELETE /study-groups/:id (kèm userId trong compat window — BE-003)
  const handleDelete = async (group: StudyGroup) => {
    if (!user?.id) return;
    if (typeof window !== 'undefined' && !window.confirm(`Xóa nhóm "${group.title}"?`)) return;
    setActingId(group.id);
    setError('');
    try {
      const response = await apiFetch(`/study-groups/${group.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!response.ok) throw new Error('Không thể xóa nhóm học tập');
      setGroups((prev) => prev.filter((g) => g.id !== group.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa nhóm học tập');
    } finally {
      setActingId(null);
    }
  };

  const openManageRequests = async (group: StudyGroup) => {
    setManagingGroupId(group.id);
    setLoadingRequests(true);
    setJoinRequests([]);
    try {
      const response = await apiFetch(`/study-groups/${group.id}/join-requests`);
      if (response.ok) {
        setJoinRequests(await response.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'accept' | 'reject') => {
    if (!managingGroupId) return;
    try {
      const response = await apiFetch(`/study-groups/${managingGroupId}/join-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (response.ok) {
        setJoinRequests(prev => prev.filter(r => r.id !== requestId));
        if (action === 'accept') {
           setGroups(prev => prev.map(g => g.id === managingGroupId ? { ...g, memberCount: g.memberCount + 1 } : g));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full flex flex-col mx-auto space-y-6 pb-20">
      <div className="glass rounded-3xl p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Nhóm Học Tập</h1>
            <p className="text-gray-400 text-sm mt-1">Tìm kiếm đồng đội chạy deadline, ôn thi.</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="glass-input rounded-full px-4 py-2 flex items-center w-full md:w-[300px] shadow-inner">
              <span className="text-gray-400 mr-2">🔍</span>
              <input
                type="text"
                placeholder="Tìm tên nhóm..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="bg-transparent border-none outline-none text-gray-200 placeholder-gray-500 w-full text-[14px]"
              />
            </div>
            <button onClick={() => setShowForm((value) => !value)} className="glass-btn px-6 py-2 rounded-full font-bold text-white whitespace-nowrap bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500 border border-blue-500/30">
              + Tạo Nhóm
            </button>
          </div>
        </div>

        {showForm && (
          <div className="relative z-10 mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Tên nhóm" className="glass-input rounded-xl px-4 py-3 text-gray-200 outline-none" />
            <input value={form.subject} onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))} placeholder="Môn học/chủ đề" className="glass-input rounded-xl px-4 py-3 text-gray-200 outline-none" />
            <input value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} placeholder="Địa điểm" className="glass-input rounded-xl px-4 py-3 text-gray-200 outline-none" />
            <input type="datetime-local" value={form.scheduledTime} onChange={(e) => setForm((prev) => ({ ...prev, scheduledTime: e.target.value }))} className="glass-input rounded-xl px-4 py-3 text-gray-200 outline-none" />
            <input value={form.schedule} onChange={(e) => setForm((prev) => ({ ...prev, schedule: e.target.value }))} placeholder="Lịch học hiển thị" className="glass-input rounded-xl px-4 py-3 text-gray-200 outline-none" />
            <input type="number" min={2} value={form.maxMembers} onChange={(e) => setForm((prev) => ({ ...prev, maxMembers: Number(e.target.value) }))} placeholder="Số thành viên tối đa" className="glass-input rounded-xl px-4 py-3 text-gray-200 outline-none" />
            <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Mô tả" className="md:col-span-2 glass-input rounded-xl px-4 py-3 text-gray-200 outline-none min-h-24" />
            <button onClick={handleCreate} disabled={saving || !user} className="md:col-span-2 rounded-xl bg-blue-600 hover:bg-cyan-500 disabled:opacity-60 py-3 text-white font-bold">
              {saving ? 'Đang tạo...' : 'Tạo nhóm học tập'}
            </button>
          </div>
        )}
      </div>

      {error && <div className="glass rounded-2xl p-4 text-red-500 border border-red-500/20">{error}</div>}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonGridCard key={i} />)}
        </div>
      )}

      {!loading && filteredGroups.length === 0 && (
        <EmptyState
          icon="👥"
          title="Chưa có nhóm học tập phù hợp"
          description="Thử đổi bộ lọc môn học, hoặc tạo nhóm mới để tìm bạn cùng học."
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {filteredGroups.map((group) => {
          const isFull = group.memberCount >= group.maxMembers;
          const isOwner = !!user?.id && (group.creatorId === user.id || group.creator?.id === user.id);
          const requested = group.joinRequestStatus === 'PENDING';
          const busy = actingId === group.id;
          return (
            <div key={group.id} className="glass rounded-2xl p-5 group hover:scale-[1.02] transition-transform duration-300 border border-white/5 hover:border-blue-500/30 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-100 text-[18px] line-clamp-2 group-hover:text-cyan-400 transition-colors">{group.title}</h3>
                <div className="px-3 py-1 rounded-full text-[12px] font-bold bg-white/5 text-gray-300 whitespace-nowrap">{group.subject}</div>
              </div>

              {group.description && <p className="text-[14px] text-gray-400 line-clamp-2">{group.description}</p>}

              <div className="flex flex-col gap-2 text-[14px] text-gray-400">
                <div className="flex items-center gap-2"><span className="text-blue-400">📅</span> {group.schedule || (group.scheduledTime ? new Date(group.scheduledTime).toLocaleString('vi-VN') : 'Chưa có lịch')}</div>
                <div className="flex items-center gap-2"><span className="text-orange-400">📍</span> {group.location}</div>
              </div>

              <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={getAvatar(group)} className="w-8 h-8 rounded-full object-cover border border-white/20" alt="" />
                  <div>
                    <p className="text-[12px] text-gray-500">Trưởng nhóm</p>
                    <p className="text-[13px] font-medium text-gray-300">{group.creator?.fullName || 'Người dùng'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-[13px] font-semibold text-gray-400 flex items-center gap-1">
                    <span className="text-xl">👥</span>
                    <span className={isFull ? 'text-red-400' : 'text-green-400'}>{group.memberCount} / {group.maxMembers}</span>
                  </div>
                  {isOwner ? (
                    <div className="flex gap-2">
                      <button onClick={() => openManageRequests(group)} disabled={busy} className="px-4 py-2 rounded-full font-bold text-[13px] transition-colors bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 disabled:opacity-50">
                        Duyệt yêu cầu
                      </button>
                      <button onClick={() => handleDelete(group)} disabled={busy} className="px-4 py-2 rounded-full font-bold text-[13px] transition-colors bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 disabled:opacity-50">
                        {busy ? 'Đang xóa...' : 'Xóa nhóm'}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleJoin(group)} disabled={isFull || requested || busy || !user} className={`px-4 py-2 rounded-full font-bold text-[13px] transition-colors ${isFull ? 'bg-red-500/20 text-red-400 cursor-not-allowed border border-red-500/30' : requested ? 'bg-white/10 text-gray-400 cursor-not-allowed border border-white/10' : 'bg-blue-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]'} disabled:opacity-60`}>
                      {isFull ? 'Đã đầy' : requested ? 'Đã gửi yêu cầu' : busy ? 'Đang gửi...' : 'Xin tham gia'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {managingGroupId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setManagingGroupId(null)}>
          <div className="w-full max-w-lg glass-panel rounded-2xl border border-white/10 overflow-hidden flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="text-lg font-bold text-white">Yêu cầu tham gia</h3>
              <button onClick={() => setManagingGroupId(null)} className="w-8 h-8 rounded-full hover:bg-white/10 text-gray-400 flex items-center justify-center">✕</button>
            </div>
            <div className="p-4 overflow-y-auto custom-scrollbar">
              {loadingRequests ? (
                <p className="text-center text-gray-400 py-4">Đang tải yêu cầu...</p>
              ) : joinRequests.length === 0 ? (
                <p className="text-center text-gray-400 py-4">Chưa có yêu cầu nào.</p>
              ) : (
                <div className="space-y-3">
                  {joinRequests.map(req => {
                    const requestUser = req.user || req.requester;

                    return (
                    <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <img src={requestUser?.avatarUrl || `https://i.pravatar.cc/150?u=${req.userId || req.id}`} className="w-10 h-10 rounded-full object-cover" alt="" />
                        <div>
                          <p className="text-[14px] font-bold text-gray-200">{requestUser?.fullName || 'Người dùng'}</p>
                          <p className="text-[12px] text-gray-500">{req.createdAt ? new Date(req.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleRequestAction(req.id, 'accept')} className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/40" title="Chấp nhận">✅</button>
                        <button onClick={() => handleRequestAction(req.id, 'reject')} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40" title="Từ chối">❌</button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
