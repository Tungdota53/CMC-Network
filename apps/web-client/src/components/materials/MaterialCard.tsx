import React from 'react';
import { Download, Heart, Eye } from 'lucide-react';
import { FileTypeIcon } from './FileTypeIcon';
import Link from 'next/link';
import { LecturerBadge } from './LecturerBadge';

interface Props {
  id: string;
  title?: string;
  type: 'PDF' | 'DOCX' | 'PPTX' | 'ZIP' | 'OTHER';
  subject?: string;
  semester?: string;
  uploaderName?: string;
  isLecturer?: boolean;
  downloadCount: number;
  viewCount: number;
  likeCount: number;
  fileSizeKB: number;
}

export const MaterialCard = ({ id, title, type, subject, semester, uploaderName, isLecturer, downloadCount, viewCount, likeCount, fileSizeKB }: Props) => {
  const displayTitle = (title || 'Tài liệu không tên').trim() || 'Tài liệu không tên';
  const displaySubject = (subject || 'Chưa phân loại').trim() || 'Chưa phân loại';
  const displaySemester = (semester || 'N/A').trim() || 'N/A';
  const displayUploader = (uploaderName || 'Người dùng ẩn danh').trim() || 'Người dùng ẩn danh';
  const uploaderFallback = displayUploader.charAt(0).toUpperCase() || 'U';

  return (
    <Link href={`/materials/${id}`} className="block">
      <div className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg hover:border-primary/30 transition-all group relative duration-300">
        {/* Type Icon & Semester */}
        <div className="flex items-start justify-between mb-4">
          <FileTypeIcon type={type} className="w-11 h-11 transition-transform group-hover:scale-105" />
          <div className="text-right">
            <span className="text-[11px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
              {displaySemester}
            </span>
          </div>
        </div>

        {/* Title & Subject */}
        <h3 className="text-[17px] font-bold text-foreground mb-1.5 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {displayTitle}
        </h3>
        <p className="text-[13px] font-semibold text-foreground/50 mb-5 truncate bg-hover inline-block px-2.5 py-0.5 rounded-md border border-border/50">{displaySubject}</p>

        {/* Uploader */}
        <div className="flex items-center gap-2 mb-5 bg-black/5 dark:bg-white/5 p-2 rounded-xl">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white font-bold text-[11px] shadow-sm shrink-0">
            {uploaderFallback}
          </div>
          <span className="text-[13.5px] text-foreground/80 font-medium truncate flex-1">{displayUploader}</span>
          {isLecturer && <LecturerBadge />}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-border/60 text-[13px] text-foreground/60 font-semibold">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
              <Heart className="w-4 h-4 fill-current text-red-500/80" />
              <span>{likeCount}</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
              <Eye className="w-4 h-4" />
              <span>{viewCount}</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-green-500 transition-colors">
              <Download className="w-4 h-4" />
              <span>{downloadCount}</span>
            </div>
          </div>
          <div className="text-foreground/40 text-[12px] bg-hover px-2 py-1 rounded-lg">
            {fileSizeKB > 1024 ? `${(fileSizeKB / 1024).toFixed(1)} MB` : `${fileSizeKB} KB`}
          </div>
        </div>
      </div>
    </Link>
  );
};
