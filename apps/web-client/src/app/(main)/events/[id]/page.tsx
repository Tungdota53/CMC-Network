'use client';

import React from 'react';
import { ChevronLeft, MapPin, Calendar, CheckCircle, Users, QrCode, Loader2, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEvent, useJoinEvent, useLeaveEvent, useCheckInEvent } from '@/hooks/useEvents';
import { useAuthStore } from '@/store/authStore';
import { LoadingState, ErrorState } from '@/components/shared/LoadingState';
import { errorMessage } from '@/lib/adapters';

const TYPE_LABELS: Record<string, string> = {
  ACADEMIC: 'Học thuật', SPORTS: 'Thể thao', CULTURAL: 'Văn hóa',
  TECH: 'Công nghệ', SOCIAL: 'Giao lưu', OTHER: 'Khác',
};

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { user } = useAuthStore();

  const { data: event, isLoading, isError, error, refetch } = useEvent(eventId);
  const joinEvent = useJoinEvent();
  const leaveEvent = useLeaveEvent();
  const checkInEvent = useCheckInEvent();

  if (isLoading) {
    return (
      <div className="max-w-[1000px] w-full pb-20 pt-6 px-4">
        <LoadingState message="Đang tải sự kiện..." />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="max-w-[1000px] w-full pb-20 pt-6 px-4">
        <Link href="/events" className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground font-semibold text-sm mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Quay lại Sự kiện
        </Link>
        <ErrorState message={isError ? errorMessage(error) : 'Không tìm thấy sự kiện'} onRetry={() => refetch()} />
      </div>
    );
  }

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const maxAttendees = event.maxAttendees ?? undefined;
  const isFull = maxAttendees ? event.attendeeCount >= maxAttendees : false;
  const attendee = event.attendees?.find((a) => a.userId === user?.id);
  const isRegistered = Boolean(attendee);
  const isCheckedIn = attendee?.status === 'CHECKED_IN';
  const busy = joinEvent.isPending || leaveEvent.isPending || checkInEvent.isPending;

  return (
    <div className="max-w-[1000px] w-full pb-20 pt-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/events" className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground font-semibold text-sm mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Quay lại Sự kiện
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl overflow-hidden bg-card aspect-[21/9] border border-border flex items-center justify-center relative">
            {event.image ? (
              <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-foreground/20 text-6xl">🎪</span>
            )}
          </div>

          <div>
            <div className="flex gap-2 mb-3 flex-wrap">
              <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg uppercase tracking-wide border border-primary/20">{TYPE_LABELS[event.type] ?? event.type}</span>
              <span className="px-2.5 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-lg uppercase tracking-wide border border-green-500/20">Miễn phí</span>
              {isCheckedIn && <span className="px-2.5 py-1 bg-blue-500/10 text-blue-500 text-xs font-bold rounded-lg border border-blue-500/20">Đã check-in</span>}
            </div>
            <h1 className="text-3xl font-extrabold text-foreground leading-tight mb-4">{event.title}</h1>
            
            <div className="flex flex-col gap-3 p-4 bg-card rounded-2xl border border-border">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 bg-background rounded-lg text-primary border border-border"><Calendar className="w-5 h-5" /></div>
                <div>
                  <p className="font-bold text-foreground text-sm">Thời gian</p>
                  <p className="text-foreground/80 text-sm">
                    {startDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-foreground/60 text-xs mt-0.5">
                    {startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="h-px bg-border ml-12" />
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 bg-background rounded-lg text-red-500 border border-border"><MapPin className="w-5 h-5" /></div>
                <div>
                  <p className="font-bold text-foreground text-sm">Địa điểm</p>
                  <p className="text-foreground/80 text-sm">{event.location || 'Chưa cập nhật'}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-foreground mb-3">Giới thiệu</h3>
            <div className="text-foreground/80 leading-relaxed text-sm whitespace-pre-wrap">
              {event.description || 'Chưa có mô tả.'}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-2xl p-6 border border-border sticky top-24">
            <h3 className="font-bold text-foreground mb-4 text-lg">Đăng ký tham gia</h3>
            
            <div className="flex justify-between items-center mb-6 text-sm">
              <span className="text-foreground/60 font-medium">Số người đăng ký</span>
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Users className="w-4 h-4 text-foreground/40" />
                {event.attendeeCount} / {maxAttendees || 'Không giới hạn'}
              </span>
            </div>

            {maxAttendees && (
              <div className="w-full bg-hover rounded-full h-2 mb-6 overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all ${isFull ? 'bg-red-500' : 'bg-primary'}`} 
                  style={{ width: `${Math.min(100, (event.attendeeCount / maxAttendees) * 100)}%` }}
                />
              </div>
            )}

            {isRegistered ? (
              <div className="text-center">
                <div className="mb-4 inline-flex items-center justify-center p-3 bg-green-500/10 text-green-500 rounded-full border border-green-500/20">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-foreground mb-2">Đã đăng ký thành công!</h4>
                <p className="text-xs text-foreground/60 mb-4">Dùng mã QR hoặc nút bên dưới để check-in tại sự kiện.</p>
                <div className="bg-background p-4 rounded-xl border border-border flex justify-center mb-4">
                  <div className="w-32 h-32 bg-card rounded-lg flex items-center justify-center border-4 border-background">
                    <QrCode className="w-12 h-12 text-foreground/40" />
                  </div>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => checkInEvent.mutate(eventId)}
                    disabled={busy || isCheckedIn}
                    className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {checkInEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : isCheckedIn ? 'Đã check-in' : 'Check-in'}
                  </button>
                  <button
                    onClick={() => leaveEvent.mutate(eventId)}
                    disabled={busy || isCheckedIn}
                    className="w-full py-2.5 bg-background border border-border text-red-500 rounded-xl font-bold text-sm hover:bg-red-500/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {leaveEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                    Hủy đăng ký
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => joinEvent.mutate(eventId)}
                disabled={isFull || busy}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${ isFull ? 'bg-hover text-foreground/40 cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90' } disabled:opacity-50`}
              >
                {joinEvent.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : isFull ? 'Đã hết chỗ' : 'Đăng ký ngay'}
              </button>
            )}

            {(joinEvent.isError || leaveEvent.isError || checkInEvent.isError) && (
              <p className="text-sm text-red-500 mt-3 font-medium">
                {errorMessage(joinEvent.error ?? leaveEvent.error ?? checkInEvent.error)}
              </p>
            )}
          </div>

          {event.organizer && (
            <div className="bg-card rounded-2xl p-5 border border-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-lg border border-primary/20 overflow-hidden">
                {event.organizer.avatarUrl ? <img src={event.organizer.avatarUrl} alt="" className="w-full h-full object-cover" /> : event.organizer.fullName?.charAt(0) || 'O'}
              </div>
              <div>
                <p className="text-xs text-foreground/50 font-medium mb-0.5">Tổ chức bởi</p>
                <p className="font-bold text-foreground">{event.organizer.fullName}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
