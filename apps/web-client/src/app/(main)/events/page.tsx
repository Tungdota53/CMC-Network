"use client";

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { useUser } from '../../contexts/UserContext';
import { SkeletonGridCard } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

interface EventItem {
  id: string;
  title: string;
  organizerId?: string;
  organizer?: { id?: string; fullName: string; avatarUrl?: string | null };
  startDate: string;
  endDate: string;
  location: string;
  attendeeCount: number;
  maxAttendees?: number | null;
  image?: string | null;
  description?: string | null;
  type: string;
  isJoined?: boolean; // giả định BE có trả về hoặc ta tự track
}

type EventAttendee = {
  id: string;
  userId?: string;
  status?: string;
  user?: { id?: string; fullName?: string; avatarUrl?: string | null; studentId?: string | null; major?: string | null };
};

const typeColors: Record<string, string> = {
  Workshop: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Hackathon: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Seminar: 'bg-green-500/20 text-green-300 border-green-500/30',
  CLB: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

export default function EventsPage() {
  const { user } = useUser();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  
  // Manage attendees state
  const [managingEventId, setManagingEventId] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await apiFetch('/events?status=PUBLISHED');
        if (!res.ok) return;
        const data: EventItem[] = await res.json();

        // Check join status for each event by fetching attendees
        if (user?.id) {
          const enriched = await Promise.all(
            data.map(async (ev) => {
              try {
                const attRes = await apiFetch(`/events/${ev.id}/attendees`);
                if (attRes.ok) {
                  const atts: EventAttendee[] = await attRes.json();
                  return { ...ev, isJoined: atts.some(a => a.userId === user.id || a.user?.id === user.id) };
                }
              } catch {}
              return { ...ev, isJoined: false };
            })
          );
          setEvents(enriched);
        } else {
          setEvents(data.map(ev => ({ ...ev, isJoined: false })));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [user?.id]);

  const handleJoin = async (event: EventItem) => {
    if (!user?.id) return;
    setActingId(event.id);
    try {
      const res = await apiFetch(`/events/${event.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        setEvents(prev => prev.map(e => e.id === event.id ? {...e, attendeeCount: e.attendeeCount + 1, isJoined: true} : e));
      }
    } catch(err) {
      console.error(err);
    } finally {
      setActingId(null);
    }
  };

  const handleLeave = async (event: EventItem) => {
    if (!user?.id) return;
    setActingId(event.id);
    try {
      const res = await apiFetch(`/events/${event.id}/join`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        setEvents(prev => prev.map(e => e.id === event.id ? {...e, attendeeCount: Math.max(0, e.attendeeCount - 1), isJoined: false} : e));
      }
    } catch(err) {
      console.error(err);
    } finally {
      setActingId(null);
    }
  };

  const openAttendees = async (event: EventItem) => {
    setManagingEventId(event.id);
    setLoadingAttendees(true);
    setAttendees([]);
    try {
       const res = await apiFetch(`/events/${event.id}/attendees`);
       if (res.ok) setAttendees(await res.json());
    } catch(err) {
       console.error(err);
    } finally {
       setLoadingAttendees(false);
    }
  };

  const handleCheckin = async (userId: string) => {
    if (!managingEventId) return;
    try {
      const res = await apiFetch(`/events/${managingEventId}/checkin`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ userId })
      });
      if (res.ok) {
         setAttendees(prev => prev.map(a => a.userId === userId || a.user?.id === userId ? {...a, status: 'CHECKED_IN'} : a));
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleDelete = async (event: EventItem) => {
    if (!user?.id) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) return;
    setActingId(event.id);
    try {
      const res = await apiFetch(`/events/${event.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== event.id));
      }
    } catch(err) {
      console.error(err);
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="w-full flex flex-col mx-auto space-y-6 pb-20">
      <div className="glass rounded-3xl p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Sự kiện</h1>
            <p className="text-gray-400 text-sm mt-1">Khám phá các sự kiện, hội thảo, cuộc thi trong trường.</p>
          </div>
          <button className="glass-btn px-6 py-2 rounded-full font-bold text-white whitespace-nowrap bg-gradient-to-r hover:from-orange-500 hover:to-red-600 border border-orange-500/30">
            + Tạo sự kiện
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonGridCard key={i} />)}
        </div>
      )}
      {!isLoading && events.length === 0 && (
        <EmptyState
          icon="📅"
          title="Chưa có sự kiện nào đang diễn ra"
          description="Theo dõi trang này để cập nhật các buổi học, hội thảo, workshop sắp diễn ra."
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map(event => {
          const start = new Date(event.startDate);
          const end = new Date(event.endDate);
          const isOwner = user?.id && (event.organizerId === user.id || event.organizer?.id === user.id);
          const isFull = event.maxAttendees && event.attendeeCount >= event.maxAttendees;
          const busy = actingId === event.id;

          return (
            <div key={event.id} className="glass rounded-2xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300 border border-white/5 hover:border-orange-500/30 flex flex-col">
              <div className="h-[200px] overflow-hidden bg-black/20 relative">
                {event.image ? (
                  <img src={event.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">📅</div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 text-[12px] font-bold rounded-full border backdrop-blur-md ${typeColors[event.type] || 'bg-white/10 text-white border-white/20'}`}>
                    {event.type}
                  </span>
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-[18px] text-gray-100 mb-2 leading-tight group-hover:text-orange-400 transition-colors">{event.title}</h3>
                
                <div className="flex items-center gap-2 mb-4">
                  <img src={event.organizer?.avatarUrl || `https://i.pravatar.cc/150?u=${event.id}`} className="w-6 h-6 rounded-full object-cover" alt="" />
                  <span className="text-[13px] text-gray-400 font-medium">{event.organizer?.fullName || 'Ban tổ chức'}</span>
                </div>

                <div className="space-y-2 text-[14px] text-gray-400 mb-4 flex-1">
                  <p className="flex items-center gap-2"><span className="text-orange-400">📅</span> <strong>{start.toLocaleDateString('vi-VN')}</strong> · {start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="flex items-center gap-2"><span className="text-red-400">📍</span> {event.location}</p>
                </div>

                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                  <button onClick={() => isOwner && openAttendees(event)} className={`text-[13px] font-semibold flex items-center gap-1 ${isOwner ? 'text-blue-400 hover:text-blue-300 cursor-pointer' : 'text-gray-500 cursor-default'}`}>
                    <span className="text-lg">👥</span> {event.attendeeCount}/{event.maxAttendees || '∞'} tham gia
                  </button>

                  <div className="flex gap-2">
                    {isOwner ? (
                      <button onClick={() => handleDelete(event)} disabled={busy} className="px-4 py-2 rounded-full font-bold text-[13px] bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors disabled:opacity-50">
                        {busy ? 'Đang xóa...' : 'Xóa sự kiện'}
                      </button>
                    ) : event.isJoined ? (
                      <button onClick={() => handleLeave(event)} disabled={busy} className="px-4 py-2 rounded-full font-bold text-[13px] bg-white/10 text-gray-300 hover:bg-white/20 border border-white/10 transition-colors disabled:opacity-50">
                        {busy ? '...' : 'Hủy tham gia'}
                      </button>
                    ) : (
                      <button onClick={() => handleJoin(event)} disabled={isFull || busy} className={`px-4 py-2 rounded-full font-bold text-[13px] transition-colors disabled:opacity-50 ${isFull ? 'bg-red-500/20 text-red-400 border border-red-500/30 cursor-not-allowed' : 'bg-orange-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'}`}>
                        {isFull ? 'Đã đầy' : busy ? 'Đang gửi...' : 'Tham gia'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {managingEventId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setManagingEventId(null)}>
          <div className="w-full max-w-lg glass-panel rounded-2xl border border-white/10 overflow-hidden flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="text-lg font-bold text-white">Danh sách tham gia</h3>
              <button onClick={() => setManagingEventId(null)} className="w-8 h-8 rounded-full hover:bg-white/10 text-gray-400 flex items-center justify-center">✕</button>
            </div>
            <div className="p-4 overflow-y-auto custom-scrollbar">
              {loadingAttendees ? (
                <p className="text-center text-gray-400 py-4">Đang tải...</p>
              ) : attendees.length === 0 ? (
                <p className="text-center text-gray-400 py-4">Chưa có ai tham gia.</p>
              ) : (
                <div className="space-y-3">
                  {attendees.map(a => {
                    const attendeeUserId = a.user?.id || a.userId;

                    return (
                    <div key={a.id || a.userId} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <img src={a.user?.avatarUrl || `https://i.pravatar.cc/150?u=${a.userId}`} className="w-10 h-10 rounded-full object-cover" alt="" />
                        <div>
                          <p className="text-[14px] font-bold text-gray-200">{a.user?.fullName || 'Người dùng'}</p>
                          <p className="text-[12px] text-gray-500">{a.user?.studentId || 'N/A'} · {a.user?.major || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {a.status === 'CHECKED_IN' ? (
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">Đã Check-in</span>
                        ) : (
                          <button disabled={!attendeeUserId} onClick={() => attendeeUserId && handleCheckin(attendeeUserId)} className="px-3 py-1.5 rounded-full text-[12px] font-bold bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 transition-colors disabled:cursor-not-allowed disabled:opacity-50">
                            Check-in
                          </button>
                        )}
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
