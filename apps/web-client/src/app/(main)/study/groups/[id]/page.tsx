'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { LoadingState, ErrorState } from '@/components/shared/LoadingState';
import { GroupWhiteboard } from '@/components/study/GroupWhiteboard';
import { errorMessage } from '@/lib/adapters';
import {
  useStudyGroup,
  useDeleteStudyGroup,
  useRequestJoinGroup,
  useJoinRequests,
  useRespondJoinRequest,
} from '@/hooks/useStudyGroups';
import { ArrowLeft, Users, MapPin, Clock, Calendar, Loader2, UserPlus, Settings, Trash2, Check, X } from 'lucide-react';

export default function StudyGroupDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user } = useAuthStore();
  const [showJoinRequests, setShowJoinRequests] = useState(false);

  const { data: group, isLoading, isError, error, refetch } = useStudyGroup(id);
  const deleteMutation = useDeleteStudyGroup();
  const joinMutation = useRequestJoinGroup();
  const { data: joinRequests } = useJoinRequests(id);
  const respondMutation = useRespondJoinRequest();

  if (isLoading) {
    return <LoadingState message="Đang tải nhóm học..." />;
  }

  if (isError) {
    return <ErrorState message={errorMessage(error)} onRetry={refetch} />;
  }

  if (!group) {
    return (
      <div className="max-w-[900px] w-full pb-20 pt-6 px-4">
        <Link href="/study/groups" className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary font-semibold text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </Link>
        <p className="text-center text-foreground/60 py-20">Không tìm thấy nhóm</p>
      </div>
    );
  }

  const isCreator = group.creatorId === user?.id;
  const isMember = group.members?.some((m) => m.userId === user?.id);
  const pendingRequests = joinRequests || [];

  const handleDelete = () => {
    if (!confirm('Bạn có chắc muốn xóa nhóm này? Hành động không thể hoàn tác.')) return;
    deleteMutation.mutate(
      { id, userId: user?.id },
      { onSuccess: () => router.push('/study/groups') },
    );
  };

  const statusColors: Record<string, string> = {
    OPEN: 'bg-green-500/10 text-green-600 dark:text-green-400',
    CLOSED: 'bg-red-500/10 text-red-500',
    FULL: 'bg-orange-500/10 text-orange-500',
  };

  return (
    <div className="max-w-[900px] w-full pb-20 pt-6 px-4">
      <Link href="/study/groups" className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary font-semibold text-sm mb-6">
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách nhóm
      </Link>

      {/* Header */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">{group.title}</h1>
              <span className={`px-2 py-0.5 text-xs font-bold rounded-lg ${statusColors[group.status ?? 'OPEN'] || 'bg-hover text-foreground/60'}`}>
                {group.status === 'OPEN' ? 'Đang mở' : group.status === 'CLOSED' ? 'Đã đóng' : group.status === 'FULL' ? 'Đã đủ' : group.status}
              </span>
            </div>
            <p className="text-foreground/60">{group.subject}</p>
          </div>
          <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-lg">{group.type || 'STUDY'}</span>
        </div>

        {group.description && (
          <p className="text-foreground/70 text-sm leading-relaxed mb-4">{group.description}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2 text-foreground/70">
            <Users className="w-4 h-4 text-foreground/40" />
            <span>{group.memberCount}/{group.maxMembers} thành viên</span>
          </div>
          <div className="flex items-center gap-2 text-foreground/70">
            <MapPin className="w-4 h-4 text-foreground/40" />
            <span>{group.location || 'Online'}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground/70">
            <Clock className="w-4 h-4 text-foreground/40" />
            <span>{group.scheduledTime ? new Date(group.scheduledTime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'Linh hoạt'}</span>
          </div>
          {group.schedule && (
            <div className="flex items-center gap-2 text-foreground/70">
              <Calendar className="w-4 h-4 text-foreground/40" />
              <span>{group.schedule}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-3 flex-wrap">
          {!isMember && !isCreator && group.status === 'OPEN' && (
            <button
              onClick={() => joinMutation.mutate({ groupId: id, userId: user?.id })}
              disabled={joinMutation.isPending}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {joinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Yêu cầu tham gia
            </button>
          )}
          {isMember && !isCreator && (
            <div className="px-6 py-2.5 bg-green-500/10 text-green-600 dark:text-green-400 font-bold rounded-xl">Bạn là thành viên</div>
          )}
          {isCreator && (
            <>
              {group.conversationId && (
                <Link href={`/messages/t/${group.conversationId}`} className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-colors">
                  Vào nhóm chat
                </Link>
              )}
              <button
                onClick={() => setShowJoinRequests(!showJoinRequests)}
                className="px-6 py-2.5 bg-hover text-foreground/70 font-bold rounded-xl hover:opacity-80 transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" /> Quản lý yêu cầu
                {pendingRequests.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">{pendingRequests.length}</span>
                )}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2.5 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500/20 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa nhóm'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Join requests panel (creator only) */}
      {isCreator && showJoinRequests && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Yêu cầu tham gia ({pendingRequests.length})</h2>
          {pendingRequests.length === 0 ? (
            <p className="text-foreground/50 text-sm py-4 text-center">Không có yêu cầu nào</p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-hover/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-hover flex items-center justify-center font-bold text-foreground/60 overflow-hidden">
                    {req.user?.avatarUrl ? <img src={req.user.avatarUrl} alt="" className="w-full h-full object-cover" /> : req.user?.fullName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${req.userId}`} className="font-medium text-foreground hover:text-primary truncate block">{req.user?.fullName}</Link>
                    {req.user?.major && <p className="text-xs text-foreground/50">{req.user.major}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondMutation.mutate({ groupId: id, requestId: req.id, action: 'accept', userId: user?.id })}
                      disabled={respondMutation.isPending}
                      className="px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg font-semibold text-sm hover:bg-green-500/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Duyệt
                    </button>
                    <button
                      onClick={() => respondMutation.mutate({ groupId: id, requestId: req.id, action: 'reject', userId: user?.id })}
                      disabled={respondMutation.isPending}
                      className="px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg font-semibold text-sm hover:bg-red-500/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" /> Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Thành viên ({group.memberCount})</h2>
        <div className="space-y-3">
          {group.members?.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-hover overflow-hidden flex items-center justify-center font-bold text-foreground/60">
                {m.user?.avatarUrl ? <img src={m.user.avatarUrl} alt="" className="w-full h-full object-cover" /> : m.user?.fullName?.charAt(0)}
              </div>
              <div className="flex-1">
                <Link href={`/profile/${m.userId}`} className="font-medium text-foreground hover:text-primary">{m.user?.fullName}</Link>
                <p className="text-xs text-foreground/50">
                  {m.role === 'owner' ? 'Trưởng nhóm' : m.role === 'admin' ? 'Quản trị' : 'Thành viên'}
                  {m.user?.major ? ` · ${m.user.major}` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Creator */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Trưởng nhóm</h2>
        <Link href={`/profile/${group.creatorId}`} className="flex items-center gap-3 hover:bg-hover/50 p-2 rounded-xl transition-colors">
          <div className="w-12 h-12 rounded-full bg-hover overflow-hidden flex items-center justify-center font-bold text-foreground/60">
            {group.creator?.avatarUrl ? <img src={group.creator.avatarUrl} alt="" className="w-full h-full object-cover" /> : group.creator?.fullName?.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-foreground">{group.creator?.fullName}</p>
            {group.creator?.hasBlueBadge && <span className="text-xs text-primary">✓ Đã xác minh</span>}
          </div>
        </Link>
      </div>

      {/* Whiteboard + Todo (members only) */}
      {isMember && (
        <div className="mt-6">
          <GroupWhiteboard groupId={id} userId={user?.id} whiteboardData={group.whiteboardData} todoList={group.todoList} />
        </div>
      )}
    </div>
  );
}
