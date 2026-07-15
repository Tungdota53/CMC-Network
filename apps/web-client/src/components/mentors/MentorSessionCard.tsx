import React from 'react';
import { Calendar, Clock, Star, Check, X, Loader2 } from 'lucide-react';

interface MentorSessionCardProps {
  id: string;
  mentorName: string;
  mentorAvatar?: string;
  topic: string;
  date: string;
  time: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  onConfirm?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  onReview?: () => void;
  loading?: boolean;
}

export const MentorSessionCard = ({
  id,
  mentorName,
  mentorAvatar,
  topic,
  date,
  time,
  status,
  onConfirm,
  onComplete,
  onCancel,
  onReview,
  loading = false,
}: MentorSessionCardProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'PENDING': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'CONFIRMED': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'COMPLETED': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'CANCELLED':
      case 'NO_SHOW': return 'bg-red-500/10 text-red-500 border-red-500/20';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'PENDING': return 'Chờ xác nhận';
      case 'CONFIRMED': return 'Sắp diễn ra';
      case 'COMPLETED': return 'Đã hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      case 'NO_SHOW': return 'Vắng mặt';
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-hover border border-border flex items-center justify-center font-bold text-foreground/60 shrink-0">
            {mentorAvatar ? (
              <img src={mentorAvatar} alt={mentorName} className="w-full h-full object-cover" />
            ) : (
              mentorName.charAt(0)
            )}
          </div>
          <div>
            <h4 className="font-bold text-foreground text-[15px]">{mentorName}</h4>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border mt-1 inline-block ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
        </div>
      </div>

      <h3 className="font-bold text-[16px] text-foreground mb-4">{topic}</h3>

      <div className="space-y-2 mb-5">
        <div className="flex items-center gap-2 text-[13px] text-foreground/70 font-medium">
          <Calendar className="w-4 h-4 text-foreground/40" /> {date}
        </div>
        <div className="flex items-center gap-2 text-[13px] text-foreground/70 font-medium">
          <Clock className="w-4 h-4 text-foreground/40" /> {time}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-foreground/60 mb-3">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...
        </div>
      )}

      {status === 'PENDING' && (
        <div className="flex gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-2.5 bg-red-500/10 text-red-600 border border-red-500/20 rounded-xl font-bold flex items-center justify-center gap-1.5 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" /> Hủy
            </button>
          )}
        </div>
      )}

      {status === 'CONFIRMED' && (
        <div className="flex gap-2">
          {onComplete && (
            <button
              onClick={onComplete}
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-xl font-bold flex items-center justify-center gap-1.5 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> Đã học xong
            </button>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={loading}
              className="py-2.5 px-3 bg-hover text-foreground/60 border border-border rounded-xl font-bold hover:bg-foreground/5 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {status === 'COMPLETED' && onReview && (
        <button
          onClick={onReview}
          disabled={loading}
          className="w-full py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          <Star className="w-4 h-4" /> Đánh giá Mentor
        </button>
      )}

      {(status === 'CANCELLED' || status === 'NO_SHOW') && (
        <div className="w-full py-2.5 bg-hover text-foreground/40 border border-border rounded-xl font-bold flex items-center justify-center gap-2">
          {getStatusText()}
        </div>
      )}
    </div>
  );
};
