import React from 'react';
import { Star, Clock, GraduationCap, ArrowRight, Award } from 'lucide-react';
import Link from 'next/link';

interface MentorCardProps {
  id: string;
  name?: string;
  avatar?: string;
  major?: string;
  bio?: string;
  expertise?: string[];
  rating?: number;
  reviewCount?: number;
  sessions?: number;
  available?: boolean;
  badges?: string[];
}

export const MentorCard = ({
  id,
  name = 'Mentor',
  avatar,
  major,
  bio,
  expertise = [],
  rating = 0,
  reviewCount = 0,
  sessions = 0,
  available = true,
  badges = [],
}: MentorCardProps) => {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 hover:border-primary/50 transition-colors relative overflow-hidden group">
      {rating >= 4.5 && (
        <div className="absolute top-0 right-0 p-4">
          <div className="flex items-center gap-1 text-[13px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{rating.toFixed(1)}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center text-center mb-5 mt-2">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-hover border-2 border-border mb-3 ring-4 ring-background flex items-center justify-center text-xl font-bold text-foreground/60 shrink-0">
          {avatar ? (
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            name.charAt(0)
          )}
        </div>
        <h3 className="text-[18px] font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{name}</h3>
        <p className="text-[14px] text-foreground/60 mb-1">{major || 'Mentor tại CMC Campus'}</p>
        {badges.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
            <Award className="w-3.5 h-3.5" /> {badges.join(', ')}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-1.5 min-h-[28px] mt-2">
          {expertise.slice(0, 3).map((spec, i) => (
            <span key={i} className="px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-[12px] font-bold">
              {spec}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-5 border-t border-border mb-5 text-[13px] text-foreground/70 font-medium">
        <div className="flex flex-col items-center gap-1">
          <Star className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-foreground">{rating.toFixed(1)}</span>
          <span className="text-[11px] text-foreground/40">Đánh giá</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <GraduationCap className="w-5 h-5 text-foreground/40" />
          <span className="font-bold text-foreground">{sessions}</span>
          <span className="text-[11px] text-foreground/40">Buổi</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Clock className="w-5 h-5 text-foreground/40" />
          <span className={`font-bold ${available ? 'text-green-500' : 'text-foreground/40'}`}>{available ? 'Sẵn sàng' : 'Bận'}</span>
          <span className="text-[11px] text-foreground/40">Trạng thái</span>
        </div>
      </div>

      <Link href={`/mentors/${id}`} className="flex w-full py-2.5 bg-hover text-foreground rounded-xl font-bold items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white transition-colors border border-border group-hover:border-primary">
        Đặt lịch ngay <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};
