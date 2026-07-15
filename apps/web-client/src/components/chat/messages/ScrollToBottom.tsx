import React from 'react';
import { ChevronDown } from 'lucide-react';

export const ScrollToBottom = ({ onClick }: { onClick: () => void }) => {
  return (
    <button 
      onClick={onClick}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors z-10"
      aria-label="Cuộn xuống cuối"
    >
      <ChevronDown className="w-6 h-6" />
    </button>
  );
};
