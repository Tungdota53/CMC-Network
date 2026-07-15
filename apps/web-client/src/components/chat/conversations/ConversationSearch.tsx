import React from 'react';
import { Search } from 'lucide-react';

export const ConversationSearch = () => {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-500" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-2 border-none rounded-full bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder-gray-500 transition-shadow"
        placeholder="Tìm kiếm trên Messenger"
      />
    </div>
  );
};
