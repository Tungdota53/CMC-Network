"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { useUser } from '../../contexts/UserContext';
import { SkeletonGridCard } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

const CATEGORIES = ['Tất cả', 'Công nghệ thông tin', 'Toán học', 'Kinh tế', 'Ngôn ngữ'];

type Material = {
  id: string;
  title: string;
  subject: string;
  fileType: string;
  fileSize?: string | null;
  downloadCount?: number;
  rating?: number;
  reviewCount?: number;
  bookmarked?: boolean;
  s3Url?: string;
  uploader?: { fullName?: string; avatarUrl?: string | null };
};

type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user?: { fullName?: string; avatarUrl?: string | null };
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'PDF': return 'bg-red-500 text-white';
    case 'DOCX': return 'bg-blue-500 text-white';
    case 'PPTX': return 'bg-orange-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

const getAvatar = (item: Material) => item.uploader?.avatarUrl || `https://i.pravatar.cc/150?u=${item.id}`;

const Stars = ({ value, size = 'text-[13px]' }: { value: number; size?: string }) => {
  const full = Math.round(value);
  return (
    <span className={`${size} tracking-tight`} aria-label={`${value} sao`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= full ? 'text-yellow-400' : 'text-slate-300'}>★</span>
      ))}
    </span>
  );
};

export default function MaterialsPage() {
  const { user } = useUser();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ title: '', subject: '', fileType: 'PDF' });
  const [tab, setTab] = useState<'all' | 'saved'>('all');
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(new Set());
  const [bookmarks, setBookmarks] = useState<Material[]>([]);
  const [detail, setDetail] = useState<Material | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadMaterials = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const query = activeCategory === 'Tất cả' ? '' : `?subject=${encodeURIComponent(activeCategory)}`;
      const response = await apiFetch(`/materials${query}`);
      if (!response.ok) throw new Error('Không thể tải tài liệu');
      setMaterials(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải tài liệu');
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadMaterials(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadMaterials]);

  // BE-007: nạp danh sách tài liệu đã bookmark của user
  const loadBookmarks = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await apiFetch(`/materials/bookmarks/${user.id}`);
      if (res.ok) {
        const data: Material[] = await res.json();
        const list = Array.isArray(data) ? data : [];
        setBookmarks(list);
        setBookmarkIds(new Set(list.map((m) => m.id)));
      }
    } catch {
      /* im lặng */
    }
  }, [user]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadBookmarks(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadBookmarks]);

  const filteredMaterials = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return materials;
    return materials.filter((item) => [item.title, item.subject, item.fileType].some((value) => value?.toLowerCase().includes(keyword)));
  }, [materials, searchQuery]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    if (selected && !form.title) {
      setForm((prev) => ({ ...prev, title: selected.name.replace(/\.[^.]+$/, ''), fileType: selected.name.split('.').pop()?.toUpperCase() || 'OTHER' }));
    }
  };

  const handleUpload = async () => {
    if (!user?.id || !file || !form.title.trim() || !form.subject.trim()) return;

    setUploading(true);
    setError('');
    try {
      const fileBuffer = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = () => reject(new Error('Không thể đọc file'));
        reader.readAsDataURL(file);
      });

      const response = await apiFetch('/materials/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploaderId: user.id, title: form.title, subject: form.subject, fileType: form.fileType, fileName: file.name, fileBuffer }),
      });
      if (!response.ok) throw new Error('Không thể tải tài liệu lên');
      const created = await response.json();
      setMaterials((prev) => [created, ...prev]);
      setForm({ title: '', subject: '', fileType: 'PDF' });
      setFile(null);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải tài liệu lên');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (item: Material) => {
    // BE-002/FE-002: đếm lượt tải qua backend, rồi mở file
    try {
      const res = await apiFetch(`/materials/${item.id}/download`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setMaterials((prev) => prev.map((m) => (m.id === item.id ? { ...m, downloadCount: data.downloadCount ?? (m.downloadCount ?? 0) + 1 } : m)));
        const url = data.s3Url || item.s3Url;
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
    } catch {
      /* fallback: vẫn mở link nếu có */
    }
    if (item.s3Url) window.open(item.s3Url, '_blank', 'noopener,noreferrer');
  };

  // BE-007: bookmark toggle -> POST /materials/:id/bookmark -> { bookmarked }
  const handleToggleBookmark = async (item: Material) => {
    if (!user?.id) return;
    const wasBookmarked = bookmarkIds.has(item.id);
    setBookmarkIds((prev) => {
      const next = new Set(prev);
      if (wasBookmarked) next.delete(item.id); else next.add(item.id);
      return next;
    });
    if (wasBookmarked) {
      setBookmarks((prev) => prev.filter((m) => m.id !== item.id));
    } else {
      setBookmarks((prev) => (prev.find((m) => m.id === item.id) ? prev : [item, ...prev]));
    }
    try {
      const res = await apiFetch(`/materials/${item.id}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        const data = await res.json();
        // server quyết -> nếu lệch optimistic thì reload bookmarks
        if (data.bookmarked !== !wasBookmarked) loadBookmarks();
      }
    } catch {
      /* im lặng */
    }
  };

  // BE-007: mở chi tiết + load review
  const openDetail = async (item: Material) => {
    setDetail(item);
    setReviews([]);
    setMyRating(5);
    setMyComment('');
    setReviewsLoading(true);
    try {
      const res = await apiFetch(`/materials/${item.id}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : []);
      }
    } catch {
      /* im lặng */
    } finally {
      setReviewsLoading(false);
    }
  };

  const submitReview = async () => {
    if (!user?.id || !detail) return;
    if (myRating < 1 || myRating > 5) return;
    setSubmittingReview(true);
    try {
      const res = await apiFetch(`/materials/${detail.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, rating: myRating, comment: myComment.trim() || undefined }),
      });
      if (res.ok) {
        const review: Review = await res.json();
        setReviews((prev) => [{ ...review, user: review.user || { fullName: user.fullName, avatarUrl: user.avatarUrl } }, ...prev]);
        // Cập nhật rating trung bình hiển thị (BE đã tính mới): refresh list
        loadMaterials();
        setMyComment('');
      }
    } catch {
      /* im lặng */
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="w-full flex flex-col mx-auto space-y-6 pb-20">
      <div className="glass rounded-3xl p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-all" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Kho Tài Liệu</h1>
            <p className="text-token-secondary text-sm mt-1">Chia sẻ và tải xuống tài liệu học tập, đề thi.</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="glass-input rounded-full px-4 py-2 flex items-center w-full md:w-[300px] shadow-inner">
              <span className="text-token-secondary mr-2">🔍</span>
              <input type="text" placeholder="Tìm tài liệu..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="bg-transparent border-none outline-none text-token-primary placeholder-gray-500 w-full text-[14px]" />
            </div>
            <button onClick={() => setShowForm((value) => !value)} className="glass-btn px-6 py-2 rounded-full font-bold text-white whitespace-nowrap bg-gradient-to-r hover:from-purple-500 hover:to-pink-600 border border-purple-500/30">+ Tải lên</button>
          </div>
        </div>

        <div className="relative z-10 flex gap-2 mt-6 overflow-x-auto no-scrollbar pb-2">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2 rounded-full text-[14px] font-semibold transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-white/5 text-token-secondary hover:bg-white/10 hover:text-white'}`}>{cat}</button>
          ))}
        </div>

        <div className="relative z-10 flex gap-2 mt-3">
          <button onClick={() => setTab('all')} className={`px-5 py-2 rounded-full text-[14px] font-bold transition-all ${tab === 'all' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-token-secondary hover:bg-white/10'}`}>Tất cả tài liệu</button>
          <button onClick={() => setTab('saved')} className={`px-5 py-2 rounded-full text-[14px] font-bold transition-all ${tab === 'saved' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-token-secondary hover:bg-white/10'}`}>🔖 Đã lưu ({bookmarks.length})</button>
        </div>

        {showForm && (
          <div className="relative z-10 mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Tên tài liệu" className="glass-input rounded-xl px-4 py-3 text-token-primary outline-none" />
            <input value={form.subject} onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))} placeholder="Môn học" className="glass-input rounded-xl px-4 py-3 text-token-primary outline-none" />
            <select value={form.fileType} onChange={(e) => setForm((prev) => ({ ...prev, fileType: e.target.value }))} className="glass-input rounded-xl px-4 py-3 text-token-primary outline-none surface-subtle">
              {['PDF', 'DOCX', 'PPTX', 'XLSX', 'ZIP', 'OTHER'].map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <input type="file" onChange={handleFileChange} className="glass-input rounded-xl px-4 py-3 text-token-primary outline-none" />
            <button onClick={handleUpload} disabled={uploading || !user || !file} className="md:col-span-2 rounded-xl bg-purple-600 hover:bg-pink-600 disabled:opacity-60 py-3 text-white font-bold">{uploading ? 'Đang tải lên...' : 'Tải tài liệu lên'}</button>
          </div>
        )}
      </div>

      {error && <div className="glass rounded-2xl p-4 text-red-500 border border-red-500/20">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonGridCard key={i} />)}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {(tab === 'saved' ? bookmarks : filteredMaterials).map((item) => {
          const isBookmarked = bookmarkIds.has(item.id);
          return (
          <div key={item.id} className="glass rounded-2xl p-5 group hover:scale-[1.02] transition-transform duration-300 border border-white/5 hover:border-purple-500/30 flex gap-4">
            <div className="w-14 h-16 shrink-0 flex items-center justify-center rounded-xl overflow-hidden relative shadow-lg">
              <div className={`absolute inset-0 opacity-20 ${getTypeColor(item.fileType)}`} />
              <div className={`relative z-10 font-black text-lg ${getTypeColor(item.fileType).replace('bg-', 'text-').split(' ')[0]}`}>{item.fileType}</div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 onClick={() => openDetail(item)} className="font-bold text-token-primary text-[16px] line-clamp-2 leading-tight group-hover:text-purple-400 transition-colors mb-1 cursor-pointer">{item.title}</h3>
                <button onClick={() => handleToggleBookmark(item)} className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isBookmarked ? 'text-yellow-400 bg-yellow-400/10' : 'text-token-tertiary hover:text-yellow-400 hover:bg-white/5'}`} title={isBookmarked ? 'Bỏ lưu' : 'Lưu tài liệu'}>
                  {isBookmarked ? '🔖' : '🏷️'}
                </button>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-token-secondary mb-3 flex-wrap">
                <button onClick={() => openDetail(item)} className="flex items-center gap-1 hover:text-yellow-300 transition-colors">
                  <Stars value={item.rating ?? 0} />
                  <span className="text-token-tertiary">{(item.rating ?? 0).toFixed(1)}{item.reviewCount != null ? ` (${item.reviewCount})` : ''}</span>
                </button>
                <span>•</span>
                <span className="flex items-center gap-1">📥 {(item.downloadCount ?? 0).toLocaleString()}</span>
                <span>•</span>
                <span>{item.fileSize || item.subject}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={getAvatar(item)} className="w-6 h-6 rounded-full object-cover" alt="" />
                  <span className="text-[12px] font-medium text-token-secondary">{item.uploader?.fullName || 'Người dùng'}</span>
                </div>
                <button onClick={() => handleDownload(item)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-purple-500 text-white flex items-center justify-center transition-colors" title="Tải xuống">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>
      )}

      {!loading && tab === 'all' && filteredMaterials.length === 0 && (
        <EmptyState
          icon="📚"
          title="Chưa có tài liệu trong mục này"
          description="Thử chọn môn học khác hoặc tải lên tài liệu đầu tiên để chia sẻ với mọi người."
        />
      )}

      {tab === 'saved' && bookmarks.length === 0 && (
        <EmptyState
          icon="🔖"
          title="Bạn chưa lưu tài liệu nào"
          description="Nhấn biểu tượng lưu trên mỗi tài liệu để xem nhanh tại đây sau này."
        />
      )}

      {detail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setDetail(null)}>
          <div className="w-full max-w-xl glass-panel rounded-2xl border border-white/10 overflow-hidden max-h-[88vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-white/10 flex justify-between items-start gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-token-primary truncate">{detail.title}</h3>
                <div className="flex items-center gap-2 text-[13px] text-token-secondary mt-1">
                  <Stars value={detail.rating ?? 0} />
                  <span>{(detail.rating ?? 0).toFixed(1)} · {detail.subject} · 📥 {(detail.downloadCount ?? 0).toLocaleString()}</span>
                </div>
              </div>
              <button onClick={() => setDetail(null)} className="w-8 h-8 rounded-full hover:bg-white/10 text-token-secondary flex items-center justify-center shrink-0">✕</button>
            </div>

            <div className="p-4 overflow-y-auto custom-scrollbar space-y-4">
              <div className="flex gap-2">
                <button onClick={() => handleDownload(detail)} className="flex-1 rounded-xl bg-purple-600 hover:bg-pink-600 py-2.5 text-white font-bold transition-colors">📥 Tải xuống</button>
                <button onClick={() => handleToggleBookmark(detail)} className={`px-4 rounded-xl font-bold transition-colors border ${bookmarkIds.has(detail.id) ? 'bg-yellow-400/15 text-yellow-300 border-yellow-400/30' : 'bg-white/5 text-token-secondary border-white/10 hover:bg-white/10'}`}>
                  {bookmarkIds.has(detail.id) ? '🔖 Đã lưu' : '🏷️ Lưu'}
                </button>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[14px] font-semibold text-token-primary mb-2">Viết đánh giá</p>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setMyRating(n)} className={`text-2xl transition-transform hover:scale-110 ${n <= myRating ? 'text-yellow-400' : 'text-slate-300'}`}>★</button>
                  ))}
                </div>
                <textarea value={myComment} onChange={(e) => setMyComment(e.target.value)} placeholder="Cảm nhận của bạn về tài liệu này (không bắt buộc)..." className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-token-primary text-[14px] outline-none min-h-[70px] focus:border-purple-500" />
                <button onClick={submitReview} disabled={submittingReview || !user} className="mt-2 w-full rounded-lg bg-purple-600 hover:bg-pink-600 disabled:opacity-60 py-2 text-white font-semibold">{submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}</button>
              </div>

              <div>
                <p className="text-[14px] font-semibold text-token-primary mb-2">Đánh giá ({reviews.length})</p>
                {reviewsLoading ? (
                  <p className="text-token-secondary text-sm py-4 text-center">Đang tải đánh giá...</p>
                ) : reviews.length === 0 ? (
                  <p className="text-token-tertiary text-sm py-4 text-center">Chưa có đánh giá. Hãy là người đầu tiên!</p>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((r) => (
                      <div key={r.id} className="flex gap-2">
                        <img src={r.user?.avatarUrl || `https://i.pravatar.cc/150?u=${r.id}`} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-token-primary">{r.user?.fullName || 'Người dùng'}</span>
                            <Stars value={r.rating} size="text-[11px]" />
                          </div>
                          {r.comment && <p className="text-[13px] text-token-secondary mt-0.5">{r.comment}</p>}
                          <span className="text-[11px] text-slate-300">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
