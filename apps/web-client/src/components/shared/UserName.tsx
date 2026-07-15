import * as React from "react";
import { cn } from "@/lib/utils";
import { VerifiedBadge } from "../ui/VerifiedBadge";

interface UserNameProps {
  name: string;
  isVerified?: boolean;
  hasBlueBadge?: boolean;
  className?: string;
  badgeSize?: number;
}

export function UserName({ name, isVerified, hasBlueBadge, className, badgeSize = 14 }: UserNameProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="font-semibold">{name}</span>
      {hasBlueBadge && <VerifiedBadge size={badgeSize} />}
    </div>
  );
}
