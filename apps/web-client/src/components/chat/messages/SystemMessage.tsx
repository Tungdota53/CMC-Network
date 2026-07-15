import React from 'react';

export const SystemMessage = ({ content }: { content: string }) => {
  return (
    <div className="w-full flex justify-center my-4">
      <span className="text-sm italic text-gray-500">
        {content}
      </span>
    </div>
  );
};
