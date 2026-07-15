import React from 'react';
import Link from 'next/link';
import { Users, ArrowRight, Sparkles, Zap, GraduationCap, Library, FileText, CalendarDays, LineChart, PlusCircle, ClipboardList } from 'lucide-react';

const quickActions = [
  { href: '/timetable', label: 'Lịch học', icon: CalendarDays, tone: 'text-green-500 bg-green-500/10' },
  { href: '/grades', label: 'GPA', icon: LineChart, tone: 'text-emerald-500 bg-emerald-500/10' },
  { href: '/study/groups', label: 'Nhóm học', icon: Users, tone: 'text-blue-500 bg-blue-500/10' },
  { href: '/study/requests', label: 'Nhu cầu học', icon: ClipboardList, tone: 'text-orange-500 bg-orange-500/10' },
  { href: '/materials', label: 'Tài liệu', icon: Library, tone: 'text-purple-500 bg-purple-500/10' },
  { href: '/study/groups/create', label: 'Tạo nhóm', icon: PlusCircle, tone: 'text-primary bg-primary/10' },
];

export default function StudyLandingPage() {
  return (
    <div className="w-full max-w-[1200px] animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24 pt-2 sm:pt-8 md:px-4">
      {/* Hero Section */}
      <div className="relative mb-6 rounded-3xl border border-border bg-card/80 p-5 text-left shadow-sm backdrop-blur sm:mb-16 sm:bg-transparent sm:p-0 sm:text-center sm:shadow-none sm:border-none">
        <div className="absolute inset-0 flex justify-center items-center -z-10 opacity-30 dark:opacity-20 pointer-events-none">
          <div className="w-[300px] h-[300px] bg-primary/40 blur-[120px] rounded-full"></div>
          <div className="w-[300px] h-[300px] bg-purple-500/40 blur-[120px] rounded-full -ml-20"></div>
        </div>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary shadow-sm sm:mb-6">
          <Sparkles className="w-4 h-4" /> Hệ sinh thái học tập thông minh
        </div>
        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-foreground sm:mb-6 sm:text-4xl md:text-5xl">
          Góc Học Tập <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500">CMC</span>
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-foreground/60 sm:text-lg md:text-xl">
          Nơi hội tụ tri thức. Tìm kiếm nhóm học, truy cập kho tài liệu số, và kết nối với mentor để khai phá toàn bộ tiềm năng học tập của bạn.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3 sm:hidden" aria-label="Lối tắt học tập">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href} className="flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-3 text-center shadow-sm active:scale-[0.98]">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${action.tone}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-xs font-semibold text-foreground">{action.label}</span>
            </Link>
          );
        })}
      </div>

      <section className="mb-6 grid gap-3 sm:hidden" aria-label="Tổng quan hôm nay">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-500/10 text-green-500">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Hôm nay</h2>
              <p className="text-sm leading-5 text-muted-foreground">Mở lịch học để xem tiết tiếp theo và cập nhật thay đổi trong ngày.</p>
              <Link href="/timetable" className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary">Xem lịch học <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <LineChart className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Điểm & GPA</h2>
              <p className="text-sm leading-5 text-muted-foreground">Theo dõi tiến độ học tập, cảnh báo học vụ và mục tiêu học kỳ.</p>
              <Link href="/grades" className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary">Xem GPA <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Feature Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8 lg:mb-16">
        <Link href="/study/groups" className="block group">
          <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 md:p-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 group-hover:scale-150 transition-transform duration-500 ease-out"></div>
            
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 md:mb-8 md:h-16 md:w-16">
              <Users className="w-8 h-8" />
            </div>
            
            <h2 className="mb-3 text-2xl font-bold text-foreground transition-colors group-hover:text-primary md:mb-4 md:text-3xl">Tìm Nhóm Học</h2>
            <p className="mb-6 flex-1 text-sm leading-6 text-foreground/70 md:mb-10 md:text-lg">
              Tham gia các nhóm học tập theo môn học, đồ án hoặc nghiên cứu chuyên sâu. Tìm kiếm những người bạn cùng chí hướng để đạt kết quả học tập tốt nhất.
            </p>
            
            <div className="mt-auto flex items-center gap-4 border-t border-border/50 pt-4 md:pt-6">
              <span className="flex min-h-10 items-center text-sm font-bold text-primary md:text-lg">
                Khám phá nhóm <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
            </div>
          </div>
        </Link>

        <Link href="/materials" className="block group">
          <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/5 md:p-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/3 group-hover:scale-150 transition-transform duration-500 ease-out"></div>
            
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-500 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 md:mb-8 md:h-16 md:w-16">
              <Library className="w-8 h-8" />
            </div>
            
            <h2 className="mb-3 text-2xl font-bold text-foreground transition-colors group-hover:text-purple-500 md:mb-4 md:text-3xl">Kho Tài Liệu & AI</h2>
            <p className="mb-6 flex-1 text-sm leading-6 text-foreground/70 md:mb-10 md:text-lg">
              Truy cập hàng ngàn tài liệu học tập, giáo trình, đề thi cũ được chia sẻ nội bộ. Tích hợp AI giúp tóm tắt nội dung và tạo flashcard tự động trong giây lát.
            </p>
            
            <div className="mt-auto flex items-center gap-4 border-t border-border/50 pt-4 md:pt-6">
              <span className="flex min-h-10 items-center text-sm font-bold text-purple-500 md:text-lg">
                Tìm tài liệu <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Stats / Highlights */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-6">
        <div className="bg-background rounded-2xl p-6 border border-border shadow-sm flex items-start gap-4 hover:border-border/80 transition-colors">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-lg mb-1">Kho tài liệu mở</h3>
            <p className="text-sm text-foreground/60 leading-relaxed">Hàng ngàn file đề thi, giáo trình được kiểm duyệt và đóng góp bởi sinh viên thủ khoa.</p>
          </div>
        </div>

        <div className="bg-background rounded-2xl p-6 border border-border shadow-sm flex items-start gap-4 hover:border-border/80 transition-colors">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-lg mb-1">AI Tóm Tắt</h3>
            <p className="text-sm text-foreground/60 leading-relaxed">Đừng đọc tài liệu hàng trăm trang, để AI phân tích và trích xuất ý chính cho bạn.</p>
          </div>
        </div>

        <div className="bg-background rounded-2xl p-6 border border-border shadow-sm flex items-start gap-4 hover:border-border/80 transition-colors">
          <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-lg mb-1">Mentor Connect</h3>
            <p className="text-sm text-foreground/60 leading-relaxed">Học hỏi kinh nghiệm thực chiến từ các Mentor, cựu sinh viên xuất sắc của CMC.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
