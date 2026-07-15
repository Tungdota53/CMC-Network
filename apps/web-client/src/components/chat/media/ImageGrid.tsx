import React from 'react';

export const ImageGrid = ({ urls }: { urls: string[] }) => {
  if (!urls || urls.length === 0) return null;

  if (urls.length === 1) {
    return (
      <img src={urls[0]} alt="Gửi ảnh" className="rounded-2xl max-w-full max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity" />
    );
  }

  if (urls.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-2xl overflow-hidden max-w-[320px]">
        {urls.map((url, i) => (
          <img key={i} src={url} alt="Gửi ảnh" className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity" />
        ))}
      </div>
    );
  }

  if (urls.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-2xl overflow-hidden max-w-[320px]">
        <img src={urls[0]} alt="Gửi ảnh" className="w-full h-full object-cover col-span-2 row-span-2 cursor-pointer hover:opacity-90 transition-opacity" />
        <img src={urls[1]} alt="Gửi ảnh" className="w-full h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity" />
        <img src={urls[2]} alt="Gửi ảnh" className="w-full h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity" />
      </div>
    );
  }

  // 4+ images
  return (
    <div className="grid grid-cols-2 gap-1 rounded-2xl overflow-hidden max-w-[320px]">
      {urls.slice(0, 4).map((url, i) => (
        <div key={i} className="relative">
          <img src={url} alt="Gửi ảnh" className="w-full h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity" />
          {i === 3 && urls.length > 4 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold text-lg pointer-events-none">
              +{urls.length - 4}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
