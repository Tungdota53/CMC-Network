import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Avatar({ src, fallback, size = 'md', className, ...props }: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full bg-hover",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt="Avatar" className="aspect-square h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-medium text-foreground/60">
          {fallback || "?"}
        </span>
      )}
    </div>
  );
}
