import { cn } from '@/lib/utils';

interface CMCLogoProps {
  className?: string;
}

export function CMCLogo({ className }: CMCLogoProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_8px_rgba(14,165,233,0.3)]">
        <defs>
          <linearGradient id="cmc-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <path d="M20 40 C 5 40, 5 20, 25 20 C 30 5, 55 5, 65 15 C 75 5, 95 10, 95 30 C 100 30, 100 40, 85 40 Z" fill="none" stroke="url(#cmc-gradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 28 40 L 40 20 L 50 40 L 60 20 L 72 40" fill="none" stroke="url(#cmc-gradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        
        {/* Nodes */}
        <circle cx="20" cy="40" r="3" fill="#0ea5e9" stroke="none"/>
        <circle cx="25" cy="20" r="3" fill="#0ea5e9" stroke="none"/>
        <circle cx="65" cy="15" r="3" fill="#0ea5e9" stroke="none"/>
        <circle cx="95" cy="30" r="3" fill="#8b5cf6" stroke="none"/>
        <circle cx="85" cy="40" r="3" fill="#8b5cf6" stroke="none"/>
        
        <circle cx="28" cy="40" r="3" fill="#0ea5e9" stroke="none"/>
        <circle cx="40" cy="20" r="3" fill="#0ea5e9" stroke="none"/>
        <circle cx="50" cy="40" r="3" fill="url(#cmc-gradient)" stroke="none"/>
        <circle cx="60" cy="20" r="3" fill="#8b5cf6" stroke="none"/>
        <circle cx="72" cy="40" r="3" fill="#8b5cf6" stroke="none"/>
      </svg>
    </div>
  );
}
