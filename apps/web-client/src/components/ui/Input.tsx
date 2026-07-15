import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-4 text-gray-400">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-[15px] text-gray-900 placeholder:text-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-50 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
              icon && "pl-11",
              error && "border-red-500 focus:ring-red-500 bg-red-50",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-sm text-red-500 font-medium pl-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
