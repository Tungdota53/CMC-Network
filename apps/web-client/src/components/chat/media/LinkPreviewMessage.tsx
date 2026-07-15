import React from 'react';

interface LinkPreviewProps {
  url: string;
  title: string;
  description: string;
  image?: string;
  domain?: string;
}

export const LinkPreviewMessage = ({ url, title, description, image, domain }: LinkPreviewProps) => {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block max-w-[320px] bg-white border rounded-xl overflow-hidden shadow-sm hover:bg-gray-50 transition-colors">
      {image && (
        <div className="w-full h-40 bg-gray-100">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-3">
        <h4 className="font-semibold text-[15px] text-gray-900 line-clamp-1">{title}</h4>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{description}</p>
        {domain && <p className="text-[11px] text-gray-400 mt-2 uppercase">{domain}</p>}
      </div>
    </a>
  );
};
