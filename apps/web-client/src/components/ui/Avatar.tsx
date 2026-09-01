import * as React from "react";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  fallback?: string | React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Avatar({ src, fallback, size = 'md', className, ...props }: AvatarProps) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
  };

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-hover text-foreground select-none",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && !imageFailed ? (
        <img src={src} alt="Avatar" onError={() => setImageFailed(true)} className="aspect-square h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-semibold text-inherit">
          {fallback ? fallback : <User className={cn("text-muted-foreground", iconSizes[size])} />}
        </span>
      )}
    </div>
  );
}
