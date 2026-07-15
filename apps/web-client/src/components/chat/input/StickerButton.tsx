import React from 'react';
import { Sticker } from 'lucide-react';

export const StickerButton = () => {
  return (
    <button className="w-9 h-9 rounded-full text-primary hover:bg-gray-100 flex items-center justify-center transition-colors">
      <Sticker className="w-6 h-6" />
    </button>
  );
};
