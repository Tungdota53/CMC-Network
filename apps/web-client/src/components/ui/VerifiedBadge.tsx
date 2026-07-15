import * as React from "react";
import { cn } from "@/lib/utils";

// Chuẩn icon Verified cho toàn dự án (theo yêu cầu PLAN)
export function VerifiedBadge({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      role="img"
      className={cn("inline-block text-blue-500 flex-shrink-0", className)}
    >
      <title>Tài khoản đã xác minh</title>
      <path d="M8.004 1.183a1.5 1.5 0 0 1 2.049-.55L12 1.759 13.947.634a1.5 1.5 0 0 1 2.05.549L17.045 3H19.5A1.5 1.5 0 0 1 21 4.5v2.453l1.817 1.05a1.5 1.5 0 0 1 .55 2.049L22.241 12l1.124 1.947a1.5 1.5 0 0 1-.55 2.05L21 17.044V19.5a1.5 1.5 0 0 1-1.5 1.5h-2.454l-1.05 1.817a1.5 1.5 0 0 1-2.048.549L12 22.241l-1.948 1.125a1.5 1.5 0 0 1-2.049-.549L6.955 21H4.5A1.5 1.5 0 0 1 3 19.5v-2.455l-1.817-1.049a1.5 1.5 0 0 1-.549-2.049L1.758 12 .634 10.053a1.5 1.5 0 0 1 .549-2.05L3 6.954V4.5A1.5 1.5 0 0 1 4.5 3h2.454l1.05-1.817zm9.703 9.024a1 1 0 0 0-1.414-1.414l-5.44 5.44a.5.5 0 0 1-.707 0l-2.439-2.44a1 1 0 0 0-1.414 1.414l2.44 2.44a2.5 2.5 0 0 0 3.535 0l5.44-5.44z" />
    </svg>
  );
}
