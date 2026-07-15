import React from 'react';
import { Star } from 'lucide-react';

interface RatingChartsProps {
  rating: number;
  reviewCount: number;
  difficulty: number;
  reviews?: { rating: number }[];
}

export const RatingCharts = ({ rating = 0, reviewCount = 0, difficulty = 0, reviews = [] }: RatingChartsProps) => {
  // Tính phân phối sao từ danh sách đánh giá thực tế
  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    return {
      star,
      count,
      pct: reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0,
    };
  });

  const ratingLabel =
    rating >= 4.5 ? 'Xuất sắc' : rating >= 3.5 ? 'Khá tốt' : rating >= 2.5 ? 'Trung bình' : rating > 0 ? 'Cần cải thiện' : 'Chưa có đánh giá';

  return (
    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm mb-6">
      <h3 className="font-bold text-foreground mb-6 text-lg">Chi tiết đánh giá</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Tổng quan */}
        <div>
          <div className="flex items-end gap-3 mb-2">
            <span className="text-5xl font-black text-foreground">{rating.toFixed(1)}</span>
            <div className="pb-1">
              <div className="flex text-amber-400 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < Math.round(rating) ? 'fill-current' : 'fill-none'}`} />
                ))}
              </div>
              <span className="text-sm text-foreground/50 font-medium">{ratingLabel}</span>
            </div>
          </div>
          <p className="text-sm text-foreground/60 font-medium mt-1">Dựa trên {reviewCount} đánh giá</p>

          <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <p className="text-primary font-semibold text-center text-sm">
              🎯 Độ khó trung bình: <span className="font-black">{difficulty > 0 ? difficulty.toFixed(1) : '—'}</span>/5
            </p>
          </div>
        </div>

        {/* Phân phối sao */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-foreground/70 uppercase tracking-wider">Phân phối đánh giá</h4>
          {distribution.map((d) => (
            <div key={d.star} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-12 text-sm font-semibold text-foreground/60">
                {d.star} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              </div>
              <div className="flex-1 h-2.5 bg-hover rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${d.pct}%` }} />
              </div>
              <span className="w-10 text-right text-xs text-foreground/50 font-medium">{d.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
