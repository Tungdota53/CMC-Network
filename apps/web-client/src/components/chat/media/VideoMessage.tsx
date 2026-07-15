import React from 'react';

export const VideoMessage = ({ url }: { url: string }) => {
  return (
    <div className="rounded-2xl overflow-hidden bg-black max-w-[320px] max-h-[300px]">
      <video 
        src={url} 
        controls 
        className="w-full h-full object-contain"
        preload="metadata"
      />
    </div>
  );
};
