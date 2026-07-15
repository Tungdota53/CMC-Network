import Link from 'next/link';
import { ArrowLeft, BookOpen, Users, Search, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/login" className="flex items-center text-gray-500 hover:text-primary transition-colors font-medium bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Quay lại Đăng nhập
          </Link>
          <div className="flex items-center gap-3 text-primary font-bold text-2xl bg-blue-50 px-5 py-2 rounded-xl border border-blue-100">
            <GraduationCap className="w-8 h-8" />
            CMC Campus
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden mb-12">
          <div className="bg-gradient-to-br from-blue-600 via-primary to-purple-600 p-12 md:p-20 text-white text-center relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[150%] bg-white opacity-5 rounded-full blur-3xl transform rotate-12"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[120%] bg-purple-300 opacity-20 rounded-full blur-3xl transform -rotate-12"></div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 relative z-10 tracking-tight">Về CMC Campus</h1>
            <p className="text-lg md:text-xl text-blue-50 max-w-2xl mx-auto relative z-10 font-medium leading-relaxed">
              Nền tảng sinh thái số toàn diện, thiết kế độc quyền dành cho sinh viên trường Đại học CMC. Kết nối, học tập và phát triển cùng nhau.
            </p>
          </div>
          
          <div className="p-8 md:p-14 text-gray-700 leading-relaxed space-y-6 text-lg">
            <p>
              <strong>CMC Campus</strong> ra đời với sứ mệnh kết nối và số hóa toàn bộ trải nghiệm học tập, giao lưu và sinh hoạt của sinh viên CMC. Thay vì phải phân tán trên nhiều hội nhóm Facebook, Zalo hay các công cụ rời rạc, mọi thứ giờ đây được quy tụ về một Hub duy nhất.
            </p>
            <p>
              Hệ thống được phát triển với kiến trúc an toàn, tốc độ siêu nhanh và thiết kế thân thiện, giúp bạn tiết kiệm thời gian tối đa để tập trung vào việc học và trải nghiệm quãng đời sinh viên một cách trọn vẹn nhất.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Trải nghiệm các tính năng nổi bật</h2>
          <p className="text-gray-500 font-medium">Khám phá những công cụ hỗ trợ độc quyền dành riêng cho sinh viên</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-100 hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Kho tài liệu & AI</h3>
            <p className="text-gray-500 text-[15px] font-medium leading-relaxed">Chia sẻ giáo trình, bài giảng, flashcard. Tích hợp AI giúp tóm tắt bài học trong chớp mắt.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-100 hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-6 group-hover:bg-green-500 group-hover:text-white transition-colors">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Cộng đồng & CLB</h3>
            <p className="text-gray-500 text-[15px] font-medium leading-relaxed">Mạng xã hội nội bộ, tìm nhóm học tập, tham gia và quản lý sự kiện các Câu lạc bộ dễ dàng.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-100 hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Đồ thất lạc (AI)</h3>
            <p className="text-gray-500 text-[15px] font-medium leading-relaxed">Tìm kiếm đồ rơi rớt quanh trường bằng công nghệ AI nhận diện hình ảnh cực kỳ thông minh.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-100 hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Uy tín & Bảo mật</h3>
            <p className="text-gray-500 text-[15px] font-medium leading-relaxed">Hệ thống phân quyền an toàn, xác thực bằng email sinh viên. Tích lũy điểm uy tín an toàn.</p>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 text-primary">
            <Sparkles className="w-32 h-32" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4 relative z-10">Bạn đã sẵn sàng kết nối?</h2>
          <p className="text-gray-500 mb-8 max-w-xl mx-auto relative z-10 font-medium text-lg">Tham gia cùng hàng ngàn sinh viên khác trên hệ sinh thái số hiện đại nhất dành riêng cho trường đại học CMC.</p>
          <Link href="/register" className="relative z-10">
            <button className="px-10 py-4 bg-primary hover:bg-[#075ce6] text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-1 text-lg">
              Tạo tài khoản ngay
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
