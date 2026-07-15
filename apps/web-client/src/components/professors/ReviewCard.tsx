import React from 'react';
import { Star, Flag } from 'lucide-react';

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    difficulty: number;
    subject?: string;
    content?: string;
    createdAt: string;
    user?: {
      id?: string;
      fullName: string;
      avatarUrl?: string;
      major?: string;
    };
  };
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  const author = review.user?.fullName || 'Sinh viên ẩn danh';
  const avatar = review.user?.avatarUrl;
  const date = new Date(review.createdAt).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-card p-5 rounded-2xl border border-border shadow-sm mb-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-hover border border-border flex items-center justify-center font-bold text-foreground/60 shrink-0">
            {avatar ? (
              <img src={avatar} alt={author} className="w-full h-full object-cover" />
            ) : (
              author.charAt(0)
            )}
          </div>
          <div>
            <h4 className="font-bold text-foreground">{author}</h4>
            {review.user?.major && (
              <p className="text-xs text-foreground/50">{review.user.major}</p>
            )}
            <p className="text-xs text-foreground/40 mt-0.5">{date}{review.subject ? ` • ${review.subject}` : ''}</p>
          </div>
        </div>
        <div className="flex bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500 mr-1" />
          <span className="font-bold text-amber-600 text-sm">{review.rating.toFixed(1)}</span>
        </div>
      </div>

      {review.content && (
        <p className="text-foreground/80 text-[15px] leading-relaxed mb-4 whitespace-pre-wrap">
          {review.content}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-3 py-1 bg-hover text-foreground/60 text-xs font-semibold rounded-lg border border-border">
          Độ khó: {review.difficulty}/5
        </span>
      </div>

      <div className="flex items-center justify-end border-t border-border/50 pt-4">
        <button className="text-foreground/40 hover:text-red-500 transition-colors" title="Báo cáo">
          <Flag className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
