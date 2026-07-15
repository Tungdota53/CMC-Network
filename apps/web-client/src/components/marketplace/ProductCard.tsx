'use client';
import React from 'react';
import Link from 'next/link';
import { Tag, MapPin } from 'lucide-react';

const CONDITION_LABEL: Record<string, string> = {
  NEW: 'Mới', LIKE_NEW: 'Như mới', GOOD: 'Tốt', FAIR: 'Ổn', POOR: 'Cũ',
  New: 'Mới', 'Like New': 'Như mới', Good: 'Tốt', Fair: 'Ổn', Poor: 'Cũ',
};

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  category?: string;
  condition?: string;
  images?: string[];
  location?: string;
  status?: string;
  seller?: { fullName?: string; avatarUrl?: string };
}

export const ProductCard = ({
  id, title, price, category, condition, images = [], location, status, seller,
}: ProductCardProps) => {
  const img = images[0];
  const isSold = status === 'SOLD';

  return (
    <div className="bg-card rounded-2xl border border-border hover:border-primary/50 transition-all group overflow-hidden flex flex-col">
      <Link href={`/marketplace/${id}`} className="block relative aspect-square bg-hover overflow-hidden">
        {img ? (
          <img src={img} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-hover">
            <Tag className="w-12 h-12 text-foreground/20" />
          </div>
        )}
        {isSold && (
          <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
            <span className="text-white font-bold text-sm bg-red-500 px-3 py-1 rounded-lg">Đã bán</span>
          </div>
        )}
      </Link>

      <div className="p-3 flex flex-col gap-1 flex-1">
        <Link href={`/marketplace/${id}`}>
          <h3 className="font-bold text-foreground text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">{title}</h3>
        </Link>

        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-extrabold text-primary text-base">
            {Number(price) === 0 ? 'Miễn phí' : `${Number(price).toLocaleString('vi-VN')}đ`}
          </span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
          <span className="text-xs text-foreground/50 font-medium">{condition ? (CONDITION_LABEL[condition] ?? condition) : ''}</span>
          <div className="flex items-center gap-2 text-xs text-foreground/40">
            {location && (
              <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{location}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
