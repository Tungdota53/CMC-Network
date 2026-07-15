'use client';

import React, { useState } from 'react';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { Search, Tag, Plus } from 'lucide-react';
import Link from 'next/link';
import { useMarketplace } from '@/hooks/useMarketplace';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/LoadingState';
import { errorMessage } from '@/lib/adapters';

const CATEGORIES = ['Tất cả', 'Sách', 'Laptop', 'Điện tử', 'Xe đạp', 'Phụ kiện', 'Quần áo', 'Đồ KTX', 'Khác'];

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  const params = {
    category: activeCategory !== 'Tất cả' ? activeCategory : undefined,
    search: searchQuery || undefined,
  };

  const { data, isLoading, isError, error, refetch } = useMarketplace(params);
  const products = Array.isArray(data) ? data : [];

  return (
    <div className="max-w-[1200px] w-full pb-20 pt-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-[28px] font-extrabold text-foreground mb-1 flex items-center gap-3">
            <Tag className="w-8 h-8 text-primary" />
            Chợ sinh viên
          </h1>
          <p className="text-foreground/60">Mua bán, trao đổi đồ trong cộng đồng CMC Campus</p>
        </div>
        <Link href="/marketplace/sell"
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm shrink-0">
          <Plus className="w-5 h-5" /> Đăng bán
        </Link>
      </div>

      <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 shadow-sm mb-5">
        <Search className="w-5 h-5 text-foreground/40 shrink-0" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm sách, đồ điện tử, xe đạp..." 
          className="flex-1 bg-transparent text-foreground placeholder:text-foreground/40 focus:outline-none" 
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button 
            key={cat} 
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${ activeCategory === cat ? 'bg-primary text-white border-primary' : 'bg-card text-foreground/70 border-border hover:border-primary/50 hover:text-primary' }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState message="Đang tải sản phẩm..." />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </div>
      ) : (
        <EmptyState title="Không có sản phẩm" description="Chưa có món đồ nào phù hợp với bộ lọc của bạn." />
      )}
    </div>
  );
}
