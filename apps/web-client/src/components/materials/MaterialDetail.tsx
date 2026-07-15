'use client';

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileTypeIcon } from './FileTypeIcon';
import { LecturerBadge } from './LecturerBadge';
import { Download, Star, MessageSquare, Bookmark, Share2, Loader2, AlertCircle, Send, Eye } from 'lucide-react';
import api from '@/lib/api';

type Material = {
  id: string;
  title: string;
  description?: string | null;
  subject?: string | null;
  semester?: string | null;
  fileType?: string | null;
  fileSize?: string | null;
  s3Url?: string | null;
  downloadCount?: number;
  bookmarkCount?: number;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  createdAt?: string;
  uploader?: {
    fullName?: string | null;
    avatarUrl?: string | null;
    isVerified?: boolean;
    hasBlueBadge?: boolean;
  } | null;
  reviews?: unknown[];
};

type MaterialReview = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt?: string;
  user?: {
    fullName?: string | null;
    avatarUrl?: string | null;
    isVerified?: boolean;
    hasBlueBadge?: boolean;
  } | null;
};

type MaterialFileType = 'PDF' | 'DOCX' | 'PPTX' | 'ZIP' | 'OTHER';

function unwrap<T>(payload: any): T {
  return payload?.data?.data ?? payload?.data ?? payload;
}

const hasMaterialId = (id?: string | null) => Boolean(id && id !== 'undefined' && id !== 'null');

const getMaterialFileUrl = (url?: string | null) => {
  if (!url) return '';
  const normalizedUrl = url.startsWith('http') ? new URL(url).pathname : url;
  if (normalizedUrl.startsWith('/uploads/materials/')) return normalizedUrl;
  if (normalizedUrl.startsWith('uploads/materials/')) return `/${normalizedUrl}`;
  if (normalizedUrl.startsWith('/materials/')) return `/uploads${normalizedUrl}`;
  if (normalizedUrl.startsWith('materials/')) return `/uploads/${normalizedUrl}`;
  return normalizedUrl;
};

const getPreviewKind = (fileType: MaterialFileType, url: string) => {
  const lowerUrl = url.toLowerCase();
  if (fileType === 'PDF' || lowerUrl.endsWith('.pdf')) return 'pdf';
  if (/\.(png|jpe?g|gif|webp|svg)$/i.test(lowerUrl)) return 'image';
  if (/\.(txt|md|csv|json)$/i.test(lowerUrl)) return 'text';
  return 'download';
};

export const MaterialDetail = ({ id }: { id: string }) => {
  const queryClient = useQueryClient();
  const [reviewRating, setReviewRating] = React.useState(5);
  const [reviewComment, setReviewComment] = React.useState('');
  const { data: material, isLoading, isError } = useQuery({
    queryKey: ['material', id],
    queryFn: async () => {
      const res = await api.get(`/materials/${id}`);
      return unwrap<Material>(res);
    },
    enabled: hasMaterialId(id),
    retry: false,
  });

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/materials/${id}/download`);
      return unwrap<{ s3Url?: string | null }>(res);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['material', id] });
      const url = data?.s3Url || material?.s3Url;
      if (url) window.open(getMaterialFileUrl(url), '_blank', 'noopener,noreferrer');
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => api.post(`/materials/${id}/bookmark`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['material-bookmarks'] }),
  });

  const reviewMutation = useMutation({
    mutationFn: async () => api.post(`/materials/${id}/reviews`, {
      rating: reviewRating,
      comment: reviewComment.trim() || undefined,
    }),
    onSuccess: () => {
      setReviewComment('');
      queryClient.invalidateQueries({ queryKey: ['material', id] });
    },
  });

  if (!hasMaterialId(id)) {
    return (
      <div className="bg-white rounded-2xl border border-red-100 p-8 text-center text-red-600">
        <AlertCircle className="w-10 h-10 mx-auto mb-3" />
        <p className="font-semibold">Đường dẫn tài liệu không hợp lệ.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-10 flex items-center justify-center min-h-[260px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !material) {
    return (
      <div className="bg-white rounded-2xl border border-red-100 p-8 text-center text-red-600">
        <AlertCircle className="w-10 h-10 mx-auto mb-3" />
        <p className="font-semibold">Không tải được chi tiết tài liệu.</p>
      </div>
    );
  }

  const fileType = (['PDF', 'DOCX', 'PPTX', 'ZIP', 'OTHER'].includes(material.fileType || '')
    ? material.fileType
    : 'OTHER') as MaterialFileType;
  const rating = Number(material.rating ?? 0);
  const reviewCount = material.reviewCount ?? material.reviews?.length ?? 0;
  const reviews = (material.reviews ?? []) as MaterialReview[];
  const fileUrl = getMaterialFileUrl(material.s3Url);
  const previewKind = getPreviewKind(fileType, fileUrl);
  const canPreview = Boolean(fileUrl && previewKind !== 'download');

  return (
    <div className="space-y-6">
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start gap-4 mb-4">
          <FileTypeIcon type={fileType} className="w-16 h-16 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-2">
              {material.semester && (
                <span className="text-[12px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{material.semester}</span>
              )}
              {material.subject && (
                <span className="text-[12px] font-semibold text-primary bg-blue-50 px-2.5 py-1 rounded-full">{material.subject}</span>
              )}
              {material.tags?.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[12px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">#{tag}</span>
              ))}
            </div>
            <h1 className="text-[22px] font-bold text-gray-900 mb-2 leading-tight">{material.title}</h1>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[14px] text-gray-600">{material.uploader?.fullName || 'Người dùng CMC'}</span>
              {material.uploader?.hasBlueBadge && <LecturerBadge />}
            </div>
            {material.createdAt && (
              <p className="text-xs text-gray-400">Cập nhật {new Date(material.createdAt).toLocaleDateString('vi-VN')}</p>
            )}
          </div>
        </div>

        <p className="text-gray-600 text-[15px] mb-6 leading-relaxed">
          {material.description || 'Tài liệu chưa có mô tả. Hãy dùng phần AI tóm tắt và flashcard bên dưới để ôn nhanh nội dung chính.'}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {canPreview && (
            <a
              href="#material-preview"
              className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Eye className="w-5 h-5" />
              Xem trực tiếp
            </a>
          )}
          <button
            onClick={() => downloadMutation.mutate()}
            disabled={downloadMutation.isPending}
            className="flex-1 bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {downloadMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {material.fileSize ? `Tải xuống (${material.fileSize})` : 'Tải xuống'}
          </button>
          <button
            onClick={() => bookmarkMutation.mutate()}
            disabled={bookmarkMutation.isPending}
            className="px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Lưu tài liệu"
          >
            {bookmarkMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bookmark className="w-5 h-5" />}
          </button>
          <button
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50 transition-colors"
            title="Sao chép liên kết"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-6 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2 text-gray-700">
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
            <span className="font-bold text-[16px]">{rating.toFixed(1)}</span>
            <span className="text-gray-500 text-[14px]">({reviewCount} đánh giá)</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <MessageSquare className="w-5 h-5" />
            <span className="font-bold text-[16px]">{reviewCount}</span>
            <span className="text-gray-500 text-[14px]">bình luận</span>
          </div>
        </div>
        <div className="text-gray-500 text-[14px]">
          Đã tải {material.downloadCount ?? 0} lần
          {typeof material.bookmarkCount === 'number' && ` · Đã lưu ${material.bookmarkCount} lần`}
        </div>
      </div>
    </div>

    {fileUrl && (
      <div id="material-preview" className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" /> Xem trước tài liệu
          </h2>
          <a href={fileUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary hover:underline">
            Mở tab mới
          </a>
        </div>
        {previewKind === 'pdf' && (
          <iframe
            src={`${fileUrl}#toolbar=1&navpanes=0&view=FitH`}
            title={`Xem trước ${material.title}`}
            className="w-full h-[760px] bg-gray-100"
          />
        )}
        {previewKind === 'image' && (
          <div className="bg-gray-950 p-4 flex items-center justify-center min-h-[420px]">
            <img src={fileUrl} alt={material.title} className="max-h-[760px] max-w-full rounded-lg shadow-2xl object-contain" />
          </div>
        )}
        {previewKind === 'text' && (
          <iframe
            src={fileUrl}
            title={`Xem trước ${material.title}`}
            className="w-full h-[620px] bg-white"
          />
        )}
        {previewKind === 'download' && (
          <div className="p-10 text-center bg-gray-50">
            <FileTypeIcon type={fileType} className="w-20 h-20 mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Định dạng này chưa xem trực tiếp được</h3>
            <p className="text-gray-500 mb-5">DOCX, PPTX, ZIP cần tải xuống hoặc mở tab mới để trình duyệt/thiết bị xử lý.</p>
            <a href={fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
              <Download className="w-5 h-5" /> Tải xuống / Mở file
            </a>
          </div>
        )}
      </div>
    )}

    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Đánh giá tài liệu</h2>
        <p className="text-sm text-gray-500">Chấm điểm giúp cộng đồng chọn tài liệu tốt hơn.</p>
      </div>

      <form
        className="p-6 border-b border-gray-100 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          reviewMutation.mutate();
        }}
      >
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setReviewRating(star)}
              className="p-1 rounded-lg hover:bg-yellow-50 transition-colors"
              aria-label={`Chọn ${star} sao`}
            >
              <Star className={`w-7 h-7 ${star <= reviewRating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
            </button>
          ))}
          <span className="text-sm font-semibold text-gray-600 ml-2">{reviewRating}/5</span>
        </div>
        <textarea
          value={reviewComment}
          onChange={(event) => setReviewComment(event.target.value)}
          placeholder="Chia sẻ cảm nhận, độ hữu ích, phần cần cải thiện..."
          rows={3}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
        />
        {reviewMutation.isError && (
          <p className="text-sm font-medium text-red-600">Không gửi được đánh giá. Hãy đăng nhập và thử lại.</p>
        )}
        <button
          type="submit"
          disabled={reviewMutation.isPending}
          className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50"
        >
          {reviewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Gửi đánh giá
        </button>
      </form>

      <div className="divide-y divide-gray-100">
        {reviews.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">Chưa có đánh giá. Hãy là người đầu tiên góp ý.</div>
        ) : reviews.map((review) => (
          <div key={review.id} className="p-6">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{review.user?.fullName || 'Sinh viên CMC'}</span>
                  {review.user?.hasBlueBadge && <LecturerBadge />}
                </div>
                {review.createdAt && <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>}
              </div>
              <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
                <Star className="w-4 h-4 fill-current" />
                {Number(review.rating).toFixed(1)}
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{review.comment || 'Không có nội dung đánh giá.'}</p>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
};
