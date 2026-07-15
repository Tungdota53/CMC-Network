'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  className?: string;
  placeholder?: string;
}

export function Select({ options, value, onChange, icon, className, placeholder }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn('relative w-full', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 text-[15px] text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all",
          icon && "pl-10"
        )}
      >
        {icon && (
          <div className="absolute left-3 text-slate-400">
            {icon}
          </div>
        )}
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 rounded-xl border border-white/10 bg-[#0f172a]/95 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] py-2 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 text-[15px] transition-colors hover:bg-white/10",
                value === option.value ? "bg-blue-500/10 text-blue-400 font-semibold" : "text-slate-200"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
