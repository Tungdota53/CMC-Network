"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import { SkeletonGridCard } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import toast from 'react-hot-toast';

interface Mentor {
  id: string;
  userId?: string;
  name: string;
  avatar: string;
  cohort: string;
  major: string;
  gpa: number;
  expertise: string[];
  rating: number;
  reviews: number;
  mentees: number;
  available: boolean;
  bio: string;
  badges: string[];
  schedule: { day: string; time: string }[];
}

export default function MentorPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [expertiseFilter, setExpertiseFilter] = useState('');

  const loadMentors = useCallback(async () => {
    try {
      setLoading(true);
      const query = expertiseFilter ? `?expertise=${encodeURIComponent(expertiseFilter)}` : '';
      const res = await apiFetch(`/mentors${query}`);
      if (res.ok) {
        const data = await res.json();
        setMentors(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error('Không thể tải danh sách mentor');
    } finally {
      setLoading(false);
    }
  }, [expertiseFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadMentors(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadMentors]);

  const avgRating = mentors.length > 0
    ? (mentors.reduce((a, m) => a + (m.rating || 0), 0) / mentors.length).toFixed(1)
    : '—';
  const totalMentees = mentors.reduce((a, m) => a + (m.mentees || 0), 0);

  return (
    <div className="w-full flex flex-col mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="glass rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center gap-3 mb-2">
          <span className="text-3xl">🎓</span>
          <div>
            <h1 className="text-2xl font-black text-token-primary">Mentor Connect</h1>
            <p className="text-token-secondary text-sm mt-1">Kết nối với anh chị khóa trên, được dẫn dắt và hỗ trợ</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 relative z-10">
          <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{mentors.length}</p>
            <p className="text-xs text-token-secondary">Mentor hoạt động</p>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalMentees}</p>
            <p className="text-xs text-token-secondary">Mentee đang dẫn dắt</p>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{avgRating}</p>
            <p className="text-xs text-token-secondary">Đánh giá TB</p>
          </div>
        </div>
      </div>

      {/* Expertise Filter */}
      <div className="glass rounded-2xl p-4 flex gap-2">
        <input
          value={expertiseFilter}
          onChange={(e) => setExpertiseFilter(e.target.value)}
          placeholder="Lọc theo chuyên môn (vd: React, Python...)"
          className="flex-1 bg-transparent outline-none text-token-primary placeholder-token-tertiary text-sm"
        />
        <button
          onClick={() => setExpertiseFilter('')}
          className="px-3 py-1.5 text-sm text-token-secondary hover:text-token-primary rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Xóa lọc
        </button>
      </div>

      {loading ? (
        <SkeletonGridCard />
      ) : mentors.length === 0 ? (
        <EmptyState
          icon="🎓"
          title="Chưa có mentor nào"
          description="Hiện chưa có mentor đăng ký. Hãy quay lại sau hoặc trở thành mentor đầu tiên!"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mentors.map((mentor) => (
            <div
              key={mentor.id}
              className="glass rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedMentor(selectedMentor?.id === mentor.id ? null : mentor)}
            >
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <img
                    src={mentor.avatar || `https://i.pravatar.cc/150?u=${mentor.id}`}
                    className="w-16 h-16 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    alt={mentor.name}
                  />
                  {mentor.available && (
                    <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-[17px] text-token-primary">{mentor.name}</h3>
                      <p className="text-[13px] text-token-secondary">{mentor.cohort} · {mentor.major}</p>
                    </div>
                    <span className={`px-2 py-1 text-[12px] font-medium rounded-full ${mentor.available ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {mentor.available ? 'Sẵn sàng' : 'Bận'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-yellow-500">⭐</span>
                    <span className="font-semibold text-[14px] text-token-primary">{mentor.rating?.toFixed(1) || '—'}</span>
                    <span className="text-[13px] text-token-secondary">({mentor.reviews} đánh giá)</span>
                  </div>

                  {mentor.expertise?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {mentor.expertise.map((exp) => (
                        <span key={exp} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-full text-[12px] font-medium">{exp}</span>
                      ))}
                    </div>
                  )}

                  {mentor.badges?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {mentor.badges.map((badge) => (
                        <span key={badge} className="px-2 py-0.5 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded-full text-[11px] font-medium">{badge}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[14px] font-semibold rounded-lg transition-colors cursor-pointer">
                      📅 Đặt lịch
                    </button>
                    <button className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-token-primary text-[14px] font-semibold rounded-lg transition-colors cursor-pointer">
                      💬 Nhắn tin
                    </button>
                  </div>
                </div>
              </div>

              {selectedMentor?.id === mentor.id && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <p className="text-[14px] text-token-secondary">{mentor.bio}</p>
                  {mentor.schedule?.length > 0 && (
                    <div>
                      <p className="font-semibold text-[14px] text-token-primary mb-1">📅 Lịch rảnh:</p>
                      <div className="flex flex-wrap gap-2">
                        {mentor.schedule.map((s) => (
                          <span key={s.day} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[13px] text-token-secondary">{s.day}: {s.time}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-[13px] text-token-secondary">
                    {mentor.gpa && <span>🎓 GPA: {mentor.gpa}/4.0</span>}
                    <span>👥 {mentor.mentees} mentee</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

