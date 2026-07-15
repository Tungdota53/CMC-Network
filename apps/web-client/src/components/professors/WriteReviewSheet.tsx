'use client';

import React, { useState } from 'react';
import { Loader2, Star } from 'lucide-react';
import { useUpsertProfessorReview } from '@/hooks/useProfessors';
import { errorMessage } from '@/lib/adapters';

interface WriteReviewSheetProps {
  professorId: string;
}

export const WriteReviewSheet = ({ professorId }: WriteReviewSheetProps) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [difficulty, setDifficulty] = useState(3);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [hoverDiff, setHoverDiff] = useState(0);

  const reviewMutation = useUpsertProfessorReview(professorId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reviewMutation.mutate(
      { rating, difficulty, subject: subject.trim() || undefined, content: content.trim() || undefined },
      { onSuccess: () => {
        setOpen(false);
        setContent('');
        setSubject('');
        setRating(5);
        setDifficulty(3);
      } },
    );
  };

  if (!open) {
    return (
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
        <h3 className="font-bold text-foreground mb-2">Đã từng học thầy/cô này?</h3>
        <p className="text-foreground/60 text-sm mb-4">Chia sẻ trải nghiệm của bạn để giúp các sinh viên khác chọn lớp phù hợp.</p>
        <button
          onClick={() => setOpen(true)}
          className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
        >
          Viết đánh giá
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card p-6 rounded-2xl border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground">Viết đánh giá</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-foreground/50 hover:text-foreground text-sm font-medium">
          Hủy
        </button>
      </div>

      {/* Rating */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-foreground/80 mb-2">Đánh giá chung</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-7 h-7 ${(hoverRating || rating) >= star ? 'fill-amber-400 text-amber-400' : 'fill-none text-foreground/30'}`}
              />
            </button>
          ))}
          <span className="ml-2 font-bold text-foreground">{rating}/5</span>
        </div>
      </div>

      {/* Difficulty */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-foreground/80 mb-2">
          Độ khó: <span className="text-primary">{difficulty}/5</span>
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={hoverDiff || difficulty}
          onChange={(e) => setDifficulty(Number(e.target.value))}
          onMouseUp={() => setHoverDiff(0)}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-foreground/40 mt-1">
          <span>Rất dễ</span>
          <span>Rất khó</span>
        </div>
      </div>

      {/* Subject */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-foreground/80 mb-2">Môn học (tùy chọn)</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="VD: Toán cao cấp, Lập trình Web..."
          maxLength={100}
          className="w-full px-4 py-2.5 bg-hover border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-foreground/40"
        />
      </div>

      {/* Content */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-foreground/80 mb-2">Nhận xét (tùy chọn)</label>
        <textarea
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Chia sẻ về cách dạy, bài tập, cách chấm điểm..."
          maxLength={2000}
          className="w-full px-4 py-3 bg-hover border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-foreground placeholder:text-foreground/40"
        />
      </div>

      {reviewMutation.isError && (
        <p className="text-sm font-medium text-red-500 mb-3">{errorMessage(reviewMutation.error)}</p>
      )}

      <button
        type="submit"
        disabled={reviewMutation.isPending}
        className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {reviewMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Star className="w-5 h-5" />}
        {reviewMutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
      </button>
    </form>
  );
};
