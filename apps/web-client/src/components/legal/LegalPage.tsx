import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, Database, FileCheck2, ShieldCheck } from 'lucide-react';

type LegalPageProps = {
  title: string;
  description: string;
  children: ReactNode;
  currentPath: '/privacy' | '/terms' | '/data-declaration';
};

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Chính sách bảo mật', icon: ShieldCheck },
  { href: '/terms', label: 'Điều khoản sử dụng', icon: FileCheck2 },
  { href: '/data-declaration', label: 'Khai báo dữ liệu', icon: Database },
] as const;

export const LEGAL_EFFECTIVE_DATE = '02/08/2026';
export const LEGAL_VERSION = '1.0';

export function LegalPage({ title, description, children, currentPath }: LegalPageProps) {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3 font-semibold hover:text-primary">
            <img src="/new-logo-transparent.png" alt="CMC Network" className="h-9 w-auto" />
            <span>CMC Network</span>
          </Link>
          <Link href="/login" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-foreground/70 hover:bg-hover hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:py-12">
        <nav aria-label="Tài liệu pháp lý" className="h-fit rounded-2xl border border-border bg-card p-2 lg:sticky lg:top-6">
          {LEGAL_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={href === currentPath ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${href === currentPath ? 'bg-primary text-white' : 'text-foreground/70 hover:bg-hover hover:text-foreground'}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <article className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
          <header className="border-b border-border pb-6">
            <p className="mb-2 text-sm font-semibold text-primary">Phiên bản {LEGAL_VERSION} · Hiệu lực từ {LEGAL_EFFECTIVE_DATE}</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-3 leading-7 text-foreground/70">{description}</p>
          </header>
          <div className="legal-content pt-6">{children}</div>
        </article>
      </div>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 text-sm text-foreground/60 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>© 2026 CMC Network. Nền tảng cộng đồng sinh viên Đại học CMC.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {LEGAL_LINKS.map(({ href, label }) => <Link key={href} href={href} className="hover:text-primary">{label}</Link>)}
          </div>
        </div>
      </footer>
    </main>
  );
}
