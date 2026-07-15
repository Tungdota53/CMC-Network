import React from 'react';
import { File, Download } from 'lucide-react';

interface FileProps {
  name: string;
  size: string;
  url: string;
}

export const FileMessage = ({ name, size, url }: FileProps) => {
  return (
    <div className="flex items-center p-3 gap-3 bg-white border rounded-xl shadow-sm min-w-[200px] max-w-[300px]">
      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
        <File className="w-5 h-5 text-blue-600" />
      </div>
      
      <div className="flex-1 overflow-hidden">
        <h4 className="text-sm font-semibold text-gray-900 truncate">{name}</h4>
        <p className="text-xs text-gray-500">{size}</p>
      </div>

      <a href={url} download target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0">
        <Download className="w-4 h-4 text-gray-600" />
      </a>
    </div>
  );
};
