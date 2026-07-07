import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CMC NetWork',
  description: 'Mạng xã hội sinh viên hiện đại',
};

// Inline pre-paint script: read theme from localStorage (or system pref) and
// stamp `class="dark"` on <html> before first paint to avoid the white flash.
const themeBootstrap = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored ? stored === 'dark' : systemDark;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
