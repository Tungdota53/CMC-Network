'use client';

import React, { useRef, useState } from 'react';
import { ChevronLeft, Loader2, Tag, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCreateMarketplaceItem, useUploadMarketplaceImage } from '@/hooks/useMarketplace';
import { errorMessage } from '@/lib/adapters';

const CATEGORIES = ['Sách', 'Laptop', 'Điện tử', 'Xe đạp', 'Phụ kiện', 'Quần áo', 'Đồ KTX', 'Khác'];
const CONDITIONS = [
  { value: 'NEW', label: 'Mới' },
  { value: 'LIKE_NEW', label: 'Như mới' },
  { value: 'GOOD', label: 'Tốt' },
  { value: 'FAIR', label: 'Ổn' },
  { value: 'POOR', label: 'Cũ' },
];

export default function SellProductPage() {
  const router = useRouter();
  const createItem = useCreateMarketplaceItem();
  const uploadImage = useUploadMarketplaceImage();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    price: '',
    description: '',
    category: 'Sách',
    condition: 'NEW',
    location: '',
  });
  const [images, setImages] = useState<string[]>([]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    for (const file of files) {
      uploadImage.mutate(file, {
        onSuccess: (data) => {
          if (data?.url) setImages((prev) => [...prev, data.url]);
        },
      });
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.price) return;
    createItem.mutate(
      {
        title: form.title.trim(),
        price: Number(form.price),
        description: form.description.trim(),
        category: form.category,
        condition: form.condition,
        location: form.location.trim() || undefined,
        images,
      },
      {
        onSuccess: (data: any) => {
          const productId = data?.id;
          router.push(productId ? `/marketplace/${productId}` : '/marketplace');
        },
      },
    );
  };

  return (
    <div className="max-w-[600px] w-full pb-20 pt-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/marketplace" className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground font-semibold text-sm mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Quay lại chợ
      </Link>

      <div className="mb-6">
        <h1 className="text-[28px] font-extrabold text-foreground mb-1 flex items-center gap-3">
          <Tag className="w-8 h-8 text-primary" />
          Đăng bán sản phẩm
        </h1>
        <p className="text-foreground/60">Đăng món đồ bạn muốn bán hoặc cho tặng</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div>
          <label className="block text-sm font-bold text-foreground mb-2">Tên sản phẩm *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="VD: Sách Cấu trúc dữ liệu và giải thuật"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Giá (VNĐ) *</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => handleChange('price', e.target.value)}
              placeholder="0 = miễn phí"
              min="0"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Danh mục</label>
            <select
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">Tình trạng</label>
          <div className="flex gap-2 flex-wrap">
            {CONDITIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => handleChange('condition', c.value)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${form.condition === c.value ? 'bg-primary text-white border-primary' : 'bg-card text-foreground/70 border-border hover:border-primary/50'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">Mô tả</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Mô tả chi tiết về sản phẩm..."
            rows={4}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">Địa điểm giao dịch</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="VD: CMC Campus, Cơ sở 2"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary"
          />
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-sm font-bold text-foreground mb-2">Hình ảnh</label>
          <div className="flex flex-wrap gap-3 mb-3">
            {images.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-foreground/80 text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadImage.isPending}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-foreground/40 hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50"
            >
              {uploadImage.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span className="text-[10px] font-bold">Tải lên</span>
                </>
              )}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          {uploadImage.isError && (
            <p className="text-sm text-red-500 mt-1">{errorMessage(uploadImage.error)}</p>
          )}
        </div>

        {createItem.isError && (
          <p className="text-sm font-medium text-red-500">{errorMessage(createItem.error)}</p>
        )}

        <button
          type="submit"
          disabled={createItem.isPending}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {createItem.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Tag className="w-5 h-5" />}
          {createItem.isPending ? 'Đang đăng...' : 'Đăng bán'}
        </button>
      </form>
    </div>
  );
}
