'use client';

import React, { useState } from 'react';

const FILTERS = ['Hộp thư', 'Cộng đồng', 'Chưa đọc'];

export const ConversationFilter = () => {
  const [active, setActive] = useState('Hộp thư');

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => setActive(f)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            active === f
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
};
