import React from 'react';

export const NotificationSkeleton = () => {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg animate-pulse">
      <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0"></div>
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );
};
