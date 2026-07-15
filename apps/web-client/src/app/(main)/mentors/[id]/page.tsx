'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Star, GraduationCap, CheckCircle, Award } from 'lucide-react';
import { useMentorDetail } from '@/hooks/useMentors';
import { MentorBookingForm } from '@/components/mentors/MentorBookingForm';
import { LoadingState, ErrorState } from '@/components/shared/LoadingState';
import { errorMessage } from '@/lib/adapters';

export default function MentorDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data: mentor, isLoading, isError, error, refetch } = useMentorDetail(id);

  if (isLoading) {
    return (
      <div className="max-w-[1000px] w-full pb-20 pt-6 px-4">
        <LoadingState message="Đang tải thông tin mentor..." />
      </div>
    );
  }

  if (isError || !mentor) {
    return (
      <div className="max-w-[1000px] w-full pb-20 pt-6 px-4">
        <Link href="/mentors" className="inline-flex items-center text-foreground/60 hover:text-foreground mb-6 font-medium transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" /> Quay lại danh sách Mentor
        </Link>
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      </div>
    );
  }

  const expertise: string[] = mentor.expertise || [];
  const reviews = mentor.reviews ?? [];

  return (
    <div className="max-w-[1000px] w-full pb-20 pt-6 px-4">
      <Link href="/mentors" className="inline-flex items-center text-foreground/60 hover:text-foreground mb-6 font-medium transition-colors">
        <ChevronLeft className="w-5 h-5 mr-1" /> Quay lại danh sách Mentor
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl border border-border p-8 flex items-start gap-6">
            <div className="w-32 h-32 shrink-0 rounded-full overflow-hidden ring-4 ring-hover bg-hover flex items-center justify-center">
              {mentor.avatar ? (
                <img src={mentor.avatar} alt={mentor.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-foreground/40">{mentor.name?.charAt(0) || '?'}</span>
              )}
            </div>
            <div>
              <h1 className="text-[28px] font-bold text-foreground mb-1 flex items-center gap-2">
                {mentor.name}
                {mentor.available && <CheckCircle className="w-6 h-6 text-green-500" />}
              </h1>
              <p className="text-lg text-foreground/60 mb-4">{mentor.major || 'Chuyên gia'} {mentor.cohort ? `· ${mentor.cohort}` : ''}</p>

              {expertise.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {expertise.map((s, i) => (
                    <span key={i} className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-bold border border-primary/20">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 text-sm font-semibold text-foreground/70">
                {mentor.rating > 0 && (
                  <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 px-3 py-1.5 rounded-lg border border-amber-500/20">
                    <Star className="w-4 h-4 fill-current" /> {mentor.rating.toFixed(1)} ({mentor.reviewCount} đánh giá)
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-hover px-3 py-1.5 rounded-lg border border-border">
                  <GraduationCap className="w-4 h-4 text-foreground/50" /> {mentor.sessions || 0} buổi mentor
                </div>
              </div>
            </div>
          </div>

          {mentor.bio && (
            <div className="bg-card rounded-2xl border border-border p-8">
              <h2 className="text-xl font-bold text-foreground mb-4">Giới thiệu</h2>
              <div className="text-foreground/70 leading-relaxed max-w-none whitespace-pre-wrap">
                {mentor.bio}
              </div>
            </div>
          )}

          {mentor.gpa != null && (
            <div className="bg-card rounded-2xl border border-border p-8">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> Thành tích
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-500/5 rounded-xl p-4 border border-amber-500/10">
                  <p className="text-sm text-foreground/50 font-medium">GPA</p>
                  <p className="text-2xl font-bold text-amber-600">{mentor.gpa.toFixed(2)}</p>
                </div>
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                  <p className="text-sm text-foreground/50 font-medium">Số buổi</p>
                  <p className="text-2xl font-bold text-primary">{mentor.sessions || 0}</p>
                </div>
              </div>
            </div>
          )}

          {reviews.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-8">
              <h2 className="text-xl font-bold text-foreground mb-4">Đánh giá từ học viên</h2>
              <div className="space-y-4">
                {reviews.slice(0, 5).map((r) => (
                  <div key={r.id} className="border-b border-border/50 pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-hover flex items-center justify-center font-bold text-foreground/60">
                          {r.mentee?.avatarUrl ? (
                            <img src={r.mentee.avatarUrl} alt={r.mentee.fullName} className="w-full h-full object-cover" />
                          ) : (
                            r.mentee?.fullName?.charAt(0) || '?'
                          )}
                        </div>
                        <span className="font-semibold text-foreground text-sm">{r.mentee?.fullName || 'Học viên'}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-amber-600 text-sm">{r.rating}</span>
                      </div>
                    </div>
                    {r.comment && <p className="text-foreground/70 text-sm leading-relaxed">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <MentorBookingForm mentorId={id} mentorName={mentor.name} />
        </div>
      </div>
    </div>
  );
}
