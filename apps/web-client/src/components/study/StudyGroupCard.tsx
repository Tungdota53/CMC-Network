import React from 'react';
import { Users, Clock, MapPin, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface Props {
  id: string;
  title: string;
  subject: string;
  type?: 'STUDY' | 'PROJECT' | 'RESEARCH' | 'EXAM_PREP';
  location?: string;
  memberCount?: number;
  currentMembers?: number;
  maxMembers: number;
  schedule?: string;
  scheduleStr?: string;
  status?: 'OPEN' | 'CLOSED' | 'FULL';
  creator?: { fullName: string; avatarUrl?: string };
  description?: string;
}

export const StudyGroupCard = (group: Props) => {
  const {
    id, title, subject, type = 'STUDY', location, memberCount, currentMembers,
    maxMembers, schedule, scheduleStr, status, creator, description,
  } = group;
  const count = memberCount ?? currentMembers ?? 0;
  const isFull = count >= maxMembers;

  const getTypeLabel = (t: string) => {
    switch (t) {
      case 'STUDY': return 'Học tập';
      case 'PROJECT': return 'Đồ án';
      case 'RESEARCH': return 'Nghiên cứu';
      case 'EXAM_PREP': return 'Ôn thi';
      default: return t;
    }
  };

  return (
    <Link href={`/study/groups/${id}`} className="block h-full">
      <div className="bg-card h-full rounded-xl border border-border p-5 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer flex flex-col group">
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[12px] font-semibold">
              {getTypeLabel(type)}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-hover text-foreground/70 border border-border text-[12px] font-semibold flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {subject}
            </span>
          </div>
          {isFull || status === 'FULL' ? (
            <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 text-[12px] font-semibold shrink-0">Đã đủ</span>
          ) : status === 'CLOSED' ? (
            <span className="px-2.5 py-1 rounded-full bg-foreground/10 text-foreground/60 border border-border text-[12px] font-semibold shrink-0">Đã đóng</span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 text-[12px] font-semibold shrink-0">Đang tuyển</span>
          )}
        </div>

        <h3 className="text-[18px] font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">{title}</h3>

        {description && (
          <p className="text-[13px] text-foreground/60 line-clamp-2 mb-2">{description}</p>
        )}

        <div className="space-y-2 mt-auto text-foreground/70 text-[14px] flex-1 pt-2">
          {(schedule || scheduleStr) && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-foreground/40 shrink-0" />
              <span className="line-clamp-1">{schedule || scheduleStr}</span>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-foreground/40 shrink-0" />
              <span className="line-clamp-1">{location}</span>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between pt-4 border-t border-border">
          {creator ? (
            <div className="flex items-center gap-2">
              {creator.avatarUrl ? (
                <img src={creator.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-hover flex items-center justify-center text-xs font-bold text-foreground/60">
                  {creator.fullName?.charAt(0)}
                </div>
              )}
              <span className="text-[13px] font-medium text-foreground/70 truncate max-w-[100px]">{creator.fullName}</span>
            </div>
          ) : (
            <div className="flex items-center -space-x-2">
              {[1, 2, 3].slice(0, count).map(i => (
                <div key={i} className="w-8 h-8 rounded-full bg-hover border-2 border-card" />
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground/60 bg-hover px-2.5 py-1 rounded-full">
            <Users className="w-4 h-4" />
            <span>{count}/{maxMembers}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
