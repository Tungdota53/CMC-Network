import React from 'react';
import { MapPin } from 'lucide-react';

export const LocationMessage = ({ lat, lng, address }: { lat: number; lng: number; address: string }) => {
  return (
    <div className="bg-white border rounded-2xl overflow-hidden shadow-sm max-w-[280px]">
      <div className="w-full h-32 bg-blue-50 flex items-center justify-center relative">
        <MapPin className="w-8 h-8 text-red-500 absolute" />
        {/* Trong thực tế sẽ thay thế bằng một static map image từ Google/Mapbox */}
        <div className="w-full h-full opacity-30" style={{ backgroundImage: 'url("https://maps.gstatic.com/tactile/basemap_styler/v6/roadmap_2x.png")', backgroundSize: 'cover' }}></div>
      </div>
      <div className="p-3 bg-white">
        <h4 className="text-sm font-semibold text-gray-900 truncate">Vị trí đã chia sẻ</h4>
        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{address}</p>
        <a 
          href={`https://maps.google.com/?q=${lat},${lng}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-2 block w-full text-center py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
        >
          Mở Bản Đồ
        </a>
      </div>
    </div>
  );
};
