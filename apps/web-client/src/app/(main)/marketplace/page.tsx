"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { useUser } from '../../contexts/UserContext';
import { SkeletonGridCard } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

const CATEGORIES = ['Tất cả', 'Giáo trình', 'Đồ điện tử', 'Phương tiện', 'Khác'];

const initialForm = {
  title: '',
  price: '',
  category: 'Giáo trình',
  condition: '',
  location: '',
  description: '',
  imageUrl: '',
};

type Product = {
  id: string;
  title: string;
  price: number | string;
  category: string;
  condition?: string | null;
  location?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  image?: string | null;
  status?: string;
  seller?: { id?: string; fullName?: string; name?: string; avatarUrl?: string | null; avatar?: string | null };
};

const formatPrice = (price: Product['price']) => {
  if (typeof price === 'number') return `${price.toLocaleString('vi-VN')}đ`;
  return price;
};

const getImage = (product: Product) => product.imageUrl || product.image || '';
const getSellerName = (product: Product) => product.seller?.fullName || product.seller?.name || 'Người bán';
const getSellerAvatar = (product: Product) => product.seller?.avatarUrl || product.seller?.avatar || `https://i.pravatar.cc/150?u=${product.seller?.id || product.id}`;

export default function MarketplacePage() {
  const { user } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const query = activeCategory === 'Tất cả' ? '' : `?category=${encodeURIComponent(activeCategory)}`;
      const response = await apiFetch(`/marketplace${query}`);
      if (!response.ok) throw new Error('Không thể tải sản phẩm');
      setProducts(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải sản phẩm');
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadProducts(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return products;
    return products.filter((product) => [product.title, product.category, product.condition, product.location].some((value) => value?.toLowerCase().includes(keyword)));
  }, [products, searchQuery]);

  const handleCreate = async () => {
    if (!user?.id || !form.title.trim() || !form.price.trim() || !form.location.trim()) return;

    setSaving(true);
    setError('');
    try {
      const response = await apiFetch('/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: Number(form.price), sellerId: user.id }),
      });
      if (!response.ok) throw new Error('Không thể đăng bán sản phẩm');
      const created = await response.json();
      setProducts((prev) => [created, ...prev]);
      setForm(initialForm);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đăng bán sản phẩm');
    } finally {
      setSaving(false);
    }
  };

  // FE-003: người bán đổi trạng thái -> PUT /marketplace/:id/status (kèm userId compat window — BE-003)
  const handleToggleStatus = async (product: Product) => {
    if (!user?.id) return;
    const nextStatus = product.status === 'SOLD' ? 'AVAILABLE' : 'SOLD';
    setActingId(product.id);
    setError('');
    try {
      const response = await apiFetch(`/marketplace/${product.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, userId: user.id }),
      });
      if (!response.ok) throw new Error('Không thể cập nhật trạng thái');
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, status: nextStatus } : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái');
    } finally {
      setActingId(null);
    }
  };

  // FE-003: người bán xóa tin -> DELETE /marketplace/:id (kèm userId compat window — BE-003)
  const handleDelete = async (product: Product) => {
    if (!user?.id) return;
    if (typeof window !== 'undefined' && !window.confirm(`Xóa tin "${product.title}"?`)) return;
    setActingId(product.id);
    setError('');
    try {
      const response = await apiFetch(`/marketplace/${product.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!response.ok) throw new Error('Không thể xóa sản phẩm');
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa sản phẩm');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="w-full flex flex-col mx-auto space-y-6 pb-20">
      <div className="glass rounded-3xl p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">Chợ Sinh Viên</h1>
            <p className="text-token-secondary text-sm mt-1">Mua bán, trao đổi giáo trình & đồ cũ uy tín.</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="glass-input rounded-full px-4 py-2 flex items-center w-full md:w-[300px] shadow-inner">
              <span className="text-token-secondary mr-2">🔍</span>
              <input type="text" placeholder="Tìm sản phẩm..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-token-primary placeholder-gray-500 w-full text-[14px]" />
            </div>
            <button onClick={() => setShowForm((value) => !value)} className="glass-btn px-6 py-2 rounded-full font-bold text-white whitespace-nowrap bg-gradient-to-r hover:from-green-500 hover:to-blue-600 border border-green-500/30">+ Đăng bán</button>
          </div>
        </div>

        <div className="relative z-10 flex gap-2 mt-6 overflow-x-auto no-scrollbar pb-2">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2 rounded-full text-[14px] font-semibold transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-green-500 text-[#0f172a] shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-white/5 text-token-secondary hover:bg-white/10 hover:text-white'}`}>{cat}</button>
          ))}
        </div>

        {showForm && (
          <div className="relative z-10 mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Tên sản phẩm" className="glass-input rounded-xl px-4 py-3 text-token-primary outline-none" />
            <input type="number" min={0} value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} placeholder="Giá bán" className="glass-input rounded-xl px-4 py-3 text-token-primary outline-none" />
            <select value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} className="glass-input rounded-xl px-4 py-3 text-token-primary outline-none surface-subtle">
              {CATEGORIES.filter((category) => category !== 'Tất cả').map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <input value={form.condition} onChange={(e) => setForm((prev) => ({ ...prev, condition: e.target.value }))} placeholder="Tình trạng" className="glass-input rounded-xl px-4 py-3 text-token-primary outline-none" />
            <input value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} placeholder="Địa điểm" className="glass-input rounded-xl px-4 py-3 text-token-primary outline-none" />
            <input value={form.imageUrl} onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))} placeholder="URL ảnh" className="glass-input rounded-xl px-4 py-3 text-token-primary outline-none" />
            <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Mô tả" className="md:col-span-2 glass-input rounded-xl px-4 py-3 text-token-primary outline-none min-h-24" />
            <button onClick={handleCreate} disabled={saving || !user} className="md:col-span-2 rounded-xl bg-green-600 hover:bg-blue-600 disabled:opacity-60 py-3 text-white font-bold">{saving ? 'Đang đăng...' : 'Đăng bán sản phẩm'}</button>
          </div>
        )}
      </div>

      {error && <div className="glass rounded-2xl p-4 text-red-500 border border-red-500/20">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonGridCard key={i} />)}
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredProducts.map((product) => {
          const isOwner = !!user?.id && product.seller?.id === user.id;
          const busy = actingId === product.id;
          return (
          <div key={product.id} className="glass rounded-2xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300 border border-white/10 hover:border-green-500/30 flex flex-col">
            <div className="relative h-48 w-full overflow-hidden bg-black/20">
              {getImage(product) ? (
                <img src={getImage(product)} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${product.status === 'SOLD' ? 'grayscale opacity-60' : ''}`} alt={product.title} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl text-token-tertiary">🛒</div>
              )}
              {product.status === 'SOLD' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-red-500/90 text-white font-black px-4 py-1.5 rounded-lg text-lg transform -rotate-12 border-2 border-red-300/50 shadow-2xl">ĐÃ BÁN</span>
                </div>
              )}
              <div className="absolute top-3 right-3 bg-[#0f172a]/80 backdrop-blur-md px-3 py-1 rounded-full text-green-400 font-bold text-[14px] border border-green-500/30">{formatPrice(product.price)}</div>
            </div>

            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-bold text-token-primary text-[16px] line-clamp-2 leading-tight group-hover:text-green-400 transition-colors mb-2">{product.title}</h3>

              <div className="flex flex-col gap-1 mb-4 mt-auto">
                <p className="text-[13px] text-token-secondary flex items-center gap-1.5"><span className="text-blue-400">🏷️</span> {product.category} {product.condition ? `• ${product.condition}` : ''}</p>
                <p className="text-[13px] text-token-secondary flex items-center gap-1.5"><span className="text-orange-400">📍</span> {product.location || 'Chưa có địa điểm'}</p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <img src={getSellerAvatar(product)} className="w-8 h-8 rounded-full border border-white/20 object-cover" alt="" />
                  <span className="text-[13px] font-medium text-token-secondary truncate">{getSellerName(product)}</span>
                </div>

                {isOwner ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggleStatus(product)} disabled={busy} className="px-3 h-9 rounded-full bg-white/5 hover:bg-white/10 text-[12px] font-semibold text-token-primary border border-white/10 transition-colors disabled:opacity-50" title="Đổi trạng thái bán">
                      {busy ? '...' : product.status === 'SOLD' ? 'Mở bán lại' : 'Đánh dấu đã bán'}
                    </button>
                    <button onClick={() => handleDelete(product)} disabled={busy} className="w-9 h-9 rounded-full bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center text-red-400 border border-red-500/30 transition-colors disabled:opacity-50" title="Xóa tin">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ) : (
                  <button disabled={product.status === 'SOLD'} className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white" title="Nhắn tin">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  </button>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>
      )}

      {!loading && filteredProducts.length === 0 && (
        <EmptyState
          icon="🛒"
          title="Không tìm thấy sản phẩm nào"
          description="Thử đổi danh mục, xoá từ khoá tìm kiếm, hoặc đăng bán món đồ đầu tiên của bạn."
        />
      )}
    </div>
  );
}
