"use client";

import { useEffect, useState } from 'react';

/**
 * ThemeToggle — flips `html.dark` and persists choice in localStorage.
 * Pre-paint stamping is handled by the inline script in app/layout.tsx,
 * so this component only controls runtime toggling. The button is
 * mounted disabled-looking (no icon swap) until hydrated to avoid an
 * SSR/CSR mismatch warning.
 */
export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setMounted(true);
      setIsDark(document.documentElement.classList.contains('dark'));
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    const root = document.documentElement;
    if (next) root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      /* private mode: skip */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      title={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
      className="w-10 h-10 rounded-full border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-all duration-300 active:scale-95"
    >
      {/* Sun / Moon — keep both rendered so SSR markup matches; toggle visibility via class */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={mounted && isDark ? 'hidden' : 'block'}
        aria-hidden="true"
      >
        {/* Moon icon — shown in light mode (means "switch to dark") */}
        <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
      </svg>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={mounted && isDark ? 'block' : 'hidden'}
        aria-hidden="true"
      >
        {/* Sun icon — shown in dark mode (means "switch to light") */}
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    </button>
  );
}
