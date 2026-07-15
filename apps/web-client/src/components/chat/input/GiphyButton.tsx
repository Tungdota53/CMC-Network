import React from 'react';

export const GiphyButton = () => {
  return (
    <button className="w-9 h-9 rounded-full text-primary hover:bg-gray-100 flex items-center justify-center transition-colors">
      <div className="bg-primary text-white text-[10px] font-bold px-1 rounded-sm tracking-tighter">
        GIF
      </div>
    </button>
  );
};
