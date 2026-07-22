import React from 'react';
import { FileText, File, Presentation, Archive, FileQuestion, Sheet } from 'lucide-react';
import type { MaterialFileType } from './materialViewModel';

interface Props {
  type: MaterialFileType;
  className?: string;
}

export const FileTypeIcon = ({ type, className = "w-10 h-10" }: Props) => {
  switch (type) {
    case 'PDF':
      return <div className={`text-red-500 bg-red-50 flex items-center justify-center rounded-xl ${className}`}><FileText className="w-1/2 h-1/2" /></div>;
    case 'DOCX':
      return <div className={`text-blue-500 bg-blue-50 flex items-center justify-center rounded-xl ${className}`}><File className="w-1/2 h-1/2" /></div>;
    case 'PPTX':
      return <div className={`text-orange-500 bg-orange-50 flex items-center justify-center rounded-xl ${className}`}><Presentation className="w-1/2 h-1/2" /></div>;
    case 'XLSX':
      return <div className={`text-emerald-600 bg-emerald-50 flex items-center justify-center rounded-xl ${className}`}><Sheet className="w-1/2 h-1/2" /></div>;
    case 'ZIP':
      return <div className={`text-yellow-600 bg-yellow-50 flex items-center justify-center rounded-xl ${className}`}><Archive className="w-1/2 h-1/2" /></div>;
    default:
      return <div className={`text-gray-500 bg-gray-100 flex items-center justify-center rounded-xl ${className}`}><FileQuestion className="w-1/2 h-1/2" /></div>;
  }
};
