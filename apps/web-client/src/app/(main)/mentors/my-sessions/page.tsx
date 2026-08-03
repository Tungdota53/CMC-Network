'use client';

import React, { useState } from 'react';
import { MentorSessionCard } from '@/components/mentors/MentorSessionCard';
import { ChevronLeft, Star } from 'lucide-react';
import Link from 'next/link';
import { useMentorBookings, useUpdateBookingStatus, useReviewMentor } from '@/hooks/useMentors';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/LoadingState';
import { errorMessage } from '@/lib/adapters';

const TABS = ['Tất cả', 'Sắp tới', 'Chờ xác nhận', 'Đã hoàn thành'] as const;
const STATUS_MAP: Record<string, string> = {
  'Tất cả': '',
  'Sắp tới': 'CONFIRMED',
  'Chờ xác nhận': 'PENDING',
  'Đã hoàn thành': 'COMPLETED',
};

export default function MySessionsPage() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Tất cả');

  const { data, isLoading, isError, error, refetch } = useMentorBookings('mentee');
  const updateStatus = useUpdateBookingStatus();
  const reviewMentor = useReviewMentor();

  const sessions = Array.isArray(data) ? data : [];
  const statusFilter = STATUS_MAP[activeTab];
  const filtered = statusFilter ? sessions.filter((s) => s.status === statusFilter) : sessions;

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const handleCancel = (bookingId: string) => updateStatus.mutate({ bookingId, status: 'CANCELLED' });
  const handleReview = (bookingId: string) => {
    const rating = window.prompt('Đánh giá từ 1-5 sao:', '5');
    if (!rating) return;
    const r = Number(rating);
    if (r < 1 || r > 5) return;
    const comment = window.prompt('Nhận xét (tùy chọn):', '') || undefined;
    reviewMentor.mutate({ bookingId, rating: r, comment });
  };

  return (
    <div className="max-w-[1000px] w-full pb-20 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4">
      <Link href="/mentors" className="inline-flex items-center text-foreground/60 hover:text-foreground mb-6 font-medium transition-colors">
        <ChevronLeft className="w-5 h-5 mr-1" />
        Quay lại Mentor Connect
      </Link>

      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-foreground mb-2">Lịch học của tôi</h1>
        <p className="text-foreground/60">Quản lý các buổi học 1-1 với Mentor của bạn</p>
      </div>

      <div className="flex gap-4 mb-6 border-b border-border overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-1 py-3 text-[15px] font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-foreground/50 hover:text-foreground/80'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {(updateStatus.isError || reviewMentor.isError) && (
        <p className="text-sm font-medium text-red-500 mb-4">
          {errorMessage(updateStatus.error ?? reviewMentor.error)}
        </p>
      )}
      {reviewMentor.isSuccess && (
        <p className="text-sm font-medium text-green-500 mb-4 flex items-center gap-1">
          <Star className="w-4 h-4 fill-current" /> Đã gửi đánh giá thành công!
        </p>
      )}

      {isLoading ? (
        <LoadingState message="Đang tải lịch học..." />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((session) => {
            const otherUser = session.mentor;
            return (
              <MentorSessionCard
                key={session.id}
                id={session.id}
                mentorName={otherUser?.fullName || 'Mentor'}
                mentorAvatar={otherUser?.avatarUrl}
                topic={session.topic || 'Tư vấn'}
                date={fmtDate(session.scheduledAt)}
                time={fmtTime(session.scheduledAt)}
                status={session.status}
                onCancel={() => handleCancel(session.id)}
                onReview={() => handleReview(session.id)}
                loading={updateStatus.isPending}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState title="Không có lịch học" description="Bạn chưa có lịch học nào trong mục này." />
      )}
    </div>
  );
}
