import Link from 'next/link';
import { CalendarDays, Compass, GraduationCap, Handshake, ShoppingBag, Sparkles, Users } from 'lucide-react';

const sections = [
  {
    title: 'Chợ sinh viên',
    description: 'Mua bán đồ dùng, tài liệu, thiết bị học tập.',
    href: '/marketplace',
    icon: ShoppingBag,
  },
  {
    title: 'Sự kiện',
    description: 'Theo dõi workshop, seminar, hoạt động CLB.',
    href: '/events',
    icon: CalendarDays,
  },
  {
    title: 'Câu lạc bộ',
    description: 'Khám phá cộng đồng và nhóm sở thích trong trường.',
    href: '/clubs',
    icon: Users,
  },
  {
    title: 'Giảng viên',
    description: 'Tìm thông tin giảng viên và học phần liên quan.',
    href: '/professors',
    icon: GraduationCap,
  },
  {
    title: 'Mentor',
    description: 'Kết nối mentor để hỏi định hướng học tập, nghề nghiệp.',
    href: '/mentors',
    icon: Handshake,
  },
  {
    title: 'AI Assistant',
    description: 'Tra cứu nhanh, tóm tắt và gợi ý học tập bằng AI.',
    href: '/ai',
    icon: Sparkles,
  },
];

export default function DiscoverPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-background p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Compass className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Khám phá</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Tất cả tiện ích CMC Network</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Lối vào nhanh cho marketplace, sự kiện, CLB, giảng viên, mentor và AI.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Danh mục khám phá">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-foreground">{section.title}</span>
                  <span className="mt-1 block text-sm leading-5 text-muted-foreground">{section.description}</span>
                </span>
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
