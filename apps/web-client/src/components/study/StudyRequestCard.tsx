import React from 'react';
import { Target, Clock, MapPin, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface Props {
  id: string;
  title: string;
  subject: string;
  description?: string;
  type?: 'FIND_PARTNER' | 'FIND_GROUP' | 'FIND_TUTOR' | 'SHARE_MATERIAL';
  preferredTime?: string;
  preferredLocation?: string;
  status?: 'OPEN' | 'MATCHED' | 'CLOSED';
  // backend sends `user: { fullName, avatarUrl, ... }`
  user?: { fullName?: string; avatarUrl?: string; major?: string; isVerified?: boolean; hasBlueBadge?: boolean };
  userId?: string;
  // fallback old props
  authorName?: string;
  authorAvatar?: string;
  time?: string;
  location?: string;
}

export const StudyRequestCard = (req: Props) => {
  const {
    id, title, subject, description, type = 'FIND_PARTNER',
    preferredTime, preferredLocation, status = 'OPEN',
    user, userId, authorName, authorAvatar, time, location,
  } = req;

  const displayName = user?.fullName || authorName || 'Ẩn danh';
  const displayAvatar = user?.avatarUrl || authorAvatar;
  const displayTime = preferredTime || time || 'Linh hoạt';
  const displayLocation = preferredLocation || location || 'Bất kỳ';
  const profileLink = userId ? `/profile/${userId}` : '#';

  const getTypeLabel = (t: string) => {
    switch (t) {
      case 'FIND_PARTNER': return 'Tìm bạn học';
      case 'FIND_GROUP': return 'Tìm nhóm';
      case 'FIND_TUTOR': return 'Tìm gia sư/Mentor';
      case 'SHARE_MATERIAL': return 'Chia sẻ tài liệu';
      default: return t;
    }
  };

  return (
    <div className="bg-card h-full rounded-xl border border-border p-5 hover:border-primary/50 hover:shadow-sm transition-all flex flex-col group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-foreground/60 bg-hover">
            {displayAvatar ? <img src={displayAvatar} alt="" className="w-full h-full object-cover" /> : displayName.charAt(0)}
          </div>
          <div>
            <Link href={profileLink} className="font-bold text-foreground text-[15px] hover:text-primary">{displayName}</Link>
            <span className="text-[12px] text-foreground/70 font-medium px-2 py-0.5 rounded-full border border-border bg-hover inline-block mt-1">
              {getTypeLabel(type)}
            </span>
          </div>
        </div>
        {status === 'OPEN' ? (
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.4)]" title="Đang tìm" />
        ) : (
          <span className="text-[11px] font-semibold text-foreground/50 bg-hover border border-border px-2 py-1 rounded shrink-0">Đã đóng</span>
        )}
      </div>

      <h3 className="text-[16px] font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-[14px] text-primary font-semibold flex items-center gap-1.5 mb-3">
        <Target className="w-4 h-4 shrink-0" /> <span className="line-clamp-1">{subject}</span>
        {user?.hasBlueBadge && <span className="text-blue-500 text-xs">✓</span>}
      </p>

      {description && <p className="text-[13px] text-foreground/60 line-clamp-2 mb-3">{description}</p>}
      
      <div className="space-y-1.5 text-foreground/70 text-[13px] mb-5 flex-1">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-foreground/40 shrink-0" />
          <span className="line-clamp-1">{displayTime}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-foreground/40 shrink-0" />
          <span className="line-clamp-1">{displayLocation}</span>
        </div>
      </div>

      <button disabled={status === 'CLOSED'} className="w-full py-2.5 rounded-xl border border-primary text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:pointer-events-none mt-auto">
        <MessageSquare className="w-4 h-4" />
        Nhắn tin ngay
      </button>
    </div>
  );
};
