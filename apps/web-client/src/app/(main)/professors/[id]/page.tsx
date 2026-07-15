'use client';

import React, { useState } from 'react';
import { RatingCharts } from '@/components/professors/RatingCharts';
import { ReviewCard } from '@/components/professors/ReviewCard';
import { WriteReviewSheet } from '@/components/professors/WriteReviewSheet';
import { ArrowLeft, Loader2, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useProfessor, useProfessorReviews } from '@/hooks/useProfessors';
import { LoadingState, ErrorState } from '@/components/shared/LoadingState';
import { errorMessage } from '@/lib/adapters';

export default function ProfessorDetailPage() {
  const params = useParams();
  const professorId = params.id as string;

  const { data: professor, isLoading, isError, error, refetch } = useProfessor(professorId);
  const { data: reviews, isLoading: loadingReviews } = useProfessorReviews(professorId);
  const [sort, setSort] = useState<'newest' | 'highest' | 'lowest'>('newest');

  if (isLoading) {
    return (
      <div className="max-w-[1000px] w-full pb-20 pt-6 px-4">
        <LoadingState message="Đang tải thông tin giảng viên..." />
      </div>
    );
  }

  if (isError || !professor) {
    return (
      <div className="max-w-[1000px] w-full pb-20 pt-6 px-4">
        <Link href="/professors" className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary font-semibold transition-colors mb-6">
          <ArrowLeft className="w-5 h-5" /> Quay lại danh sách
        </Link>
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      </div>
    );
  }

  const reviewList = reviews ?? professor.reviews ?? [];
  const sortedReviews = [...reviewList].sort((a, b) => {
    if (sort === 'highest') return b.rating - a.rating;
    if (sort === 'lowest') return a.rating - b.rating;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="max-w-[1000px] w-full pb-20 pt-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <Link href="/professors" className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary font-semibold transition-colors">
          <ArrowLeft className="w-5 h-5" /> Quay lại danh sách
        </Link>
      </div>

      <div className="bg-card rounded-3xl p-8 border border-border shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-r from-primary/5 to-primary/10" />

        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-hover border-4 border-background shadow-md flex items-center justify-center text-2xl font-bold text-foreground/60 shrink-0">
            {professor.avatarUrl ? (
              <img src={professor.avatarUrl} alt={professor.name} className="w-full h-full object-cover" />
            ) : (
              professor.name?.charAt(0) || 'P'
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold text-foreground mb-1">{professor.name || 'Đang tải...'}</h1>
            <p className="text-foreground/60 text-lg">{professor.faculty || 'Khoa'}</p>
            {professor.department && (
              <p className="text-foreground/40 text-sm mt-0.5">{professor.department}</p>
            )}
          </div>
          <button className="px-4 py-2 bg-hover hover:bg-foreground/5 text-foreground rounded-xl font-bold border border-border transition-colors flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Chia sẻ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RatingCharts
            rating={professor.rating ?? 0}
            reviewCount={professor.reviewCount ?? 0}
            difficulty={professor.difficulty ?? 0}
            reviews={reviewList}
          />

          <div className="flex items-center justify-between mb-4 mt-8">
            <h3 className="text-xl font-bold text-foreground">Bài đánh giá ({reviewList.length})</h3>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'newest' | 'highest' | 'lowest')}
              className="px-3 py-1.5 bg-card border border-border text-foreground rounded-lg text-sm font-semibold focus:outline-none"
            >
              <option value="newest">Mới nhất</option>
              <option value="highest">Điểm cao nhất</option>
              <option value="lowest">Điểm thấp nhất</option>
            </select>
          </div>

          {loadingReviews ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sortedReviews.length > 0 ? (
            <div className="space-y-4">
              {sortedReviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <p className="text-foreground/60">Chưa có bài đánh giá nào. Hãy là người đầu tiên!</p>
            </div>
          )}
        </div>

        <div>
          <WriteReviewSheet professorId={professorId} />

          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 mt-6">
            <h4 className="font-bold text-primary mb-3">Tag phổ biến</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-card text-foreground/80 text-xs font-bold rounded-lg border border-border shadow-sm">Có điểm danh</span>
              <span className="px-3 py-1.5 bg-card text-foreground/80 text-xs font-bold rounded-lg border border-border shadow-sm">Nhiều bài tập</span>
              <span className="px-3 py-1.5 bg-card text-foreground/80 text-xs font-bold rounded-lg border border-border shadow-sm">Dễ hiểu</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
