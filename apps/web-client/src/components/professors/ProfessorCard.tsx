import React from 'react';
import Link from 'next/link';
import { Star, MessageSquare, MapPin } from 'lucide-react';

interface ProfessorCardProps {
  id: string;
  name: string;
  faculty?: string;
  department?: string;
  avatarUrl?: string;
  rating: number;
  reviewCount: number;
}

export const ProfessorCard = ({
  id,
  name,
  faculty,
  department,
  avatarUrl,
  rating = 0,
  reviewCount = 0,
}: ProfessorCardProps) => {
  return (
    <Link href={`/professors/${id}`} className="block">
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 hover:border-primary/50 group cursor-pointer h-full flex flex-col relative overflow-hidden">
        {rating >= 4.5 && reviewCount >= 5 && (
          <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-[0_2px_10px_rgba(239,68,68,0.3)]">
            🔥 TOP RATED
          </div>
        )}

        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-hover border-2 border-border shrink-0 flex items-center justify-center text-xl font-bold text-foreground/60">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              name?.charAt(0) || 'P'
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 text-[17px]">{name}</h3>
            {faculty && <p className="text-sm text-foreground/60 line-clamp-1 mt-0.5">{faculty}</p>}
            {department && (
              <p className="text-xs text-foreground/40 line-clamp-1 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {department}
              </p>
            )}
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            <span className="font-bold text-foreground text-lg">{rating.toFixed(1)}</span>
            <span className="text-sm text-foreground/40 font-medium">/ 5.0</span>
          </div>

          <div className="flex items-center gap-1.5 text-foreground/70 text-sm font-medium bg-hover px-2.5 py-1.5 rounded-lg border border-border/30">
            <MessageSquare className="w-4 h-4" />
            {reviewCount} đánh giá
          </div>
        </div>
      </div>
    </Link>
  );
};
