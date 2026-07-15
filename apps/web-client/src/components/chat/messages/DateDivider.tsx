import React from 'react';

export const DateDivider = ({ date }: { date: Date }) => {
  return (
    <div className="w-full flex justify-center my-4">
      <span className="text-xs font-medium text-gray-500">
        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
};
