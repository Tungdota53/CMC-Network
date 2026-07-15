'use client';

import React, { useState } from 'react';
import { ChevronLeft, MapPin, MessageCircle, Shield, Loader2, Trash2, CheckCircle2, Flag } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMarketplaceItem, useBuyProduct, useUpdateMarketplaceStatus, useDeleteMarketplaceItem, useReportProduct } from '@/hooks/useMarketplace';
import { useAuthStore } from '@/store/authStore';
import { LoadingState, ErrorState } from '@/components/shared/LoadingState';
import { errorMessage } from '@/lib/adapters';

const CONDITION_LABEL: Record<string, string> = {
  NEW: 'Mới', LIKE_NEW: 'Như mới', GOOD: 'Tốt', FAIR: 'Ổn', POOR: 'Cũ',
  New: 'Mới', 'Like New': 'Như mới', Good: 'Tốt', Fair: 'Ổn', Poor: 'Cũ',
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user } = useAuthStore();
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading, isError, error, refetch } = useMarketplaceItem(id);
  const buyProduct = useBuyProduct();
  const updateStatus = useUpdateMarketplaceStatus();
  const deleteProduct = useDeleteMarketplaceItem();
  const reportProduct = useReportProduct();

  if (isLoading) {
    return (
      <div className="max-w-[1000px] w-full pb-20 pt-6 px-4">
        <LoadingState message="Đang tải sản phẩm..." />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-[1000px] w-full pb-20 pt-6 px-4">
        <Link href="/marketplace" className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground font-semibold text-sm mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Quay lại chợ
        </Link>
        <ErrorState message={isError ? errorMessage(error) : 'Không tìm thấy sản phẩm'} onRetry={() => refetch()} />
      </div>
    );
  }

  const images: string[] = Array.isArray(product.images) ? product.images : [];
  const isSold = product.status === 'SOLD';
  const isOwner = product.sellerId === user?.id;

  const handleDelete = () => {
    if (!window.confirm('Xóa sản phẩm này?')) return;
    deleteProduct.mutate(id, { onSuccess: () => router.push('/marketplace') });
  };

  const handleContactSeller = () => {
    router.push(`/messages?t=${product.sellerId}`);
  };

  const handleReport = () => {
    const reason = window.prompt('Lý do báo cáo (spam, lừa đảo, nội dung không phù hợp...):', '');
    if (!reason?.trim()) return;
    reportProduct.mutate({ productId: id, reason: reason.trim() });
  };

  return (
    <div className="max-w-[1000px] w-full pb-20 pt-6 px-4">
      <Link href="/marketplace" className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground font-semibold text-sm mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Quay lại chợ
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square bg-hover rounded-2xl flex items-center justify-center border border-border overflow-hidden">
            {images.length > 0 ? (
              <img src={images[selectedImage]} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-6xl text-foreground/20">📷</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${i === selectedImage ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex gap-2 mb-2 flex-wrap">
              <span className={`px-2 py-0.5 text-xs font-bold rounded-lg border ${isSold ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-600 border-green-500/20'}`}>
                {isSold ? 'Đã bán' : 'Đang bán'}
              </span>
              {product.condition && (
                <span className="px-2 py-0.5 bg-hover text-foreground/70 text-xs font-semibold rounded-lg border border-border">
                  {CONDITION_LABEL[product.condition] ?? product.condition}
                </span>
              )}
              {product.category && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-lg border border-primary/20">
                  {product.category}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-foreground mb-2">{product.title}</h1>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-primary">
                {Number(product.price) === 0 ? 'Miễn phí' : `${Number(product.price).toLocaleString('vi-VN')}đ`}
              </span>
            </div>
          </div>

          {product.location && (
            <div className="flex items-center gap-2 text-sm text-foreground/70">
              <MapPin className="w-4 h-4 text-foreground/40" />
              <span className="font-semibold">Giao dịch tại:</span> {product.location}
            </div>
          )}

          {product.description && (
            <div className="bg-card rounded-2xl p-4 text-foreground/80 text-sm leading-relaxed border border-border whitespace-pre-wrap">
              {product.description}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!isOwner && !isSold && (
              <>
                <button
                  onClick={() => buyProduct.mutate(id)}
                  disabled={buyProduct.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {buyProduct.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {buyProduct.isPending ? 'Đang xử lý...' : 'Mua ngay'}
                </button>
                <button
                  onClick={handleContactSeller}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-card text-foreground font-bold rounded-xl border border-border hover:border-primary/50 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" /> Nhắn tin
                </button>
              </>
            )}
            {isOwner && !isSold && (
              <>
                <button
                  onClick={() => updateStatus.mutate({ id, status: 'SOLD' })}
                  disabled={updateStatus.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold rounded-xl hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                >
                  {updateStatus.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Đánh dấu đã bán
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteProduct.isPending}
                  className="w-12 h-12 flex items-center justify-center border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                  {deleteProduct.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                </button>
              </>
            )}
            {isOwner && isSold && (
              <button
                onClick={handleDelete}
                disabled={deleteProduct.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-hover text-foreground/60 font-bold rounded-xl border border-border hover:bg-foreground/5 transition-colors disabled:opacity-50"
              >
                {deleteProduct.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                Xóa sản phẩm
              </button>
            )}
            {isSold && !isOwner && (
              <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-hover text-foreground/50 font-bold rounded-xl border border-border">
                Sản phẩm đã được bán
              </div>
            )}
          </div>

          {(buyProduct.isError || updateStatus.isError || deleteProduct.isError || reportProduct.isError) && (
            <p className="text-sm font-medium text-red-500">
              {errorMessage(buyProduct.error ?? updateStatus.error ?? deleteProduct.error ?? reportProduct.error)}
            </p>
          )}

          {reportProduct.isSuccess && (
            <p className="text-sm font-medium text-green-500 flex items-center gap-1">
              <Flag className="w-4 h-4" /> Đã gửi báo cáo. Quản trị viên sẽ xem xét.
            </p>
          )}

          {!isOwner && (
            <button
              onClick={handleReport}
              disabled={reportProduct.isPending}
              className="flex items-center gap-1.5 text-sm text-foreground/40 hover:text-red-500 font-semibold transition-colors disabled:opacity-50"
            >
              {reportProduct.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
              Báo cáo sản phẩm
            </button>
          )}

          {/* Seller info */}
          {product.seller && (
            <Link href={`/profile/${product.sellerId}`} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-hover border border-border flex items-center justify-center text-foreground/60 font-bold text-lg shrink-0 overflow-hidden">
                {product.seller.avatarUrl ? (
                  <img src={product.seller.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  product.seller.fullName?.charAt(0) || '?'
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">{product.seller.fullName}</p>
                <p className="text-xs text-foreground/50">
                  {product.seller.createdAt ? `Tham gia ${new Date(product.seller.createdAt).getFullYear()}` : 'Người bán'}
                </p>
              </div>
            </Link>
          )}

          <div className="flex items-center gap-2 text-xs text-foreground/40">
            <Shield className="w-3.5 h-3.5" /> Marketplace chỉ là nền tảng kết nối. Giao dịch trực tiếp tại trường.
          </div>
        </div>
      </div>
    </div>
  );
}
