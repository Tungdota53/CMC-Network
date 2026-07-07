import React from 'react';

/**
 * EmptyState — a consistent, friendly placeholder for "no data" / "no results"
 * across pages. Pass an emoji or SVG via `icon`, a title, optional description,
 * and an optional call-to-action node.
 */
export default function EmptyState({
  icon = '✨',
  title,
  description,
  action,
  className = '',
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`w-full glass rounded-3xl p-10 flex flex-col items-center text-center animate-fade-rise ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-3xl mb-4 animate-float">
        {icon}
      </div>
      <h3 className="text-[17px] font-bold text-slate-800">{title}</h3>
      {description && (
        <p className="text-[14px] text-slate-500 mt-1.5 max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
