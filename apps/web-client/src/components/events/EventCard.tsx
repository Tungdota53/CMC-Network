'use client';
import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  ACADEMIC: 'Học thuật', SPORTS: 'Thể thao', CULTURAL: 'Văn hóa',
  TECH: 'Công nghệ', SOCIAL: 'Giao lưu', OTHER: 'Khác',
  ACADEMIC_EVENT: 'Học thuật', WORKSHOP: 'Workshop', SEMINAR: 'Seminar',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' }) + ' · ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

interface EventCardProps {
  id: string;
  title: string;
  type?: string;
  location?: string;
  startDate: string;
  maxAttendees?: number | null;
  attendeeCount?: number;
  status?: string;
  image?: string | null;
  organizer?: { fullName?: string };
}

export const EventCard = ({ id, title, type, location, startDate, maxAttendees, attendeeCount = 0, image, organizer }: EventCardProps) => {
  const isFull = maxAttendees ? attendeeCount >= maxAttendees : false;

  return (
    <Link href={`/events/${id}`} className="block">
      <div className="bg-card rounded-2xl border border-border hover:border-primary/50 transition-all group overflow-hidden flex flex-col">
        <div className="relative h-40 bg-hover overflow-hidden">
          {image
            ? <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full flex items-center justify-center text-foreground/20 text-6xl">🎪</div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            {type && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-primary/90 text-white">
                {TYPE_LABELS[type] ?? type}
              </span>
            )}
          </div>
          {isFull && (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg">HẾT CHỖ</div>
          )}
        </div>

        <div className="p-4 flex flex-col gap-2 flex-1">
          <h3 className="font-bold text-foreground text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors">{title}</h3>
          <div className="flex items-center gap-1.5 text-foreground/50 text-xs">
            <Calendar className="w-3.5 h-3.5 text-foreground/30 shrink-0" />
            <span>{formatDate(startDate)}</span>
          </div>
          {location && (
            <div className="flex items-center gap-1.5 text-foreground/50 text-xs">
              <MapPin className="w-3.5 h-3.5 text-foreground/30 shrink-0" />
              <span className="line-clamp-1">{location}</span>
            </div>
          )}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
            <div className="flex items-center gap-1 text-foreground/50 text-xs">
              <Users className="w-3.5 h-3.5" />
              <span>{attendeeCount}{maxAttendees ? `/${maxAttendees}` : ''}</span>
            </div>
            {organizer?.fullName && (
              <span className="text-xs text-foreground/40 font-medium">bởi {organizer.fullName}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
