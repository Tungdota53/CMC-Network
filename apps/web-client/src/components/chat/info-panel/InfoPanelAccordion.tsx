'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const InfoPanelAccordion = ({ title, children, defaultOpen = false }: Props) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 last:border-0 py-2">
      <button 
        className="w-full flex items-center justify-between px-2 py-2 hover:bg-gray-50 rounded-lg transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold text-[14px] text-gray-900">{title}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="px-2 pt-1 pb-2 animate-in slide-in-from-top-1 fade-in duration-200">
          {children}
        </div>
      )}
    </div>
  );
};
