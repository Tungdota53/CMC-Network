export default function ProfilePage() {
  const user = {
    name: 'Nguyễn Văn A',
    studentId: 'CMC2023001',
    department: 'Khoa Công nghệ thông tin',
    major: 'Kỹ thuật phần mềm',
    cohort: 'K15 (2023-2027)',
    email: 'nguyenvana@cmc.edu.vn',
    avatar: 'https://i.pravatar.cc/150?img=11',
    coverPhoto: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&h=400&fit=crop',
    bio: 'Đam mê lập trình, thích học React & AI 🚀',
    skills: ['React', 'TypeScript', 'Python', 'NestJS', 'PostgreSQL'],
    achievements: ['GPA 3.8/4.0', 'Giải nhất Hackathon 2024', 'Chứng chỉ AWS Cloud Practitioner'],
    reputation: 1250,
    badges: [
      { name: 'Mentor xuất sắc', icon: '🏆', color: 'bg-yellow-100 text-yellow-700' },
      { name: 'Chuyên gia React', icon: '⚛️', color: 'bg-blue-100 text-blue-700' },
      { name: 'Người chia sẻ', icon: '📚', color: 'bg-green-100 text-green-700' },
    ],
    friends: 234,
    posts: 45,
    documents: 12,
  };

  return (
    <div className="pb-10">
      {/* Cover Photo */}
      <div className="relative -mx-4 lg:-mx-8">
        <div className="h-[350px] md:h-[400px] overflow-hidden relative group">
          <img src={user.coverPhoto} className="w-full h-full object-cover rounded-b-[2rem]" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent pointer-events-none" />
        </div>

        {/* Profile Info Overlay */}
        <div className="px-4 md:px-8 pb-4 flex flex-col md:flex-row items-start md:items-end -mt-24 relative z-10">
          <div className="relative group cursor-pointer">
            <div className="w-[168px] h-[168px] rounded-full border-4 border-white overflow-hidden shadow-2xl bg-slate-50 relative z-10">
              <img src={user.avatar} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
          </div>

          <div className="md:ml-6 mt-4 md:mt-0 flex-1">
            <h1 className="text-[32px] md:text-[38px] font-bold text-slate-800 leading-tight drop-shadow-sm">{user.name}</h1>
            <p className="text-[17px] text-slate-500 font-medium mt-1">{user.bio}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[15px] text-slate-700 font-semibold">{user.friends} bạn bè</span>
              <span className="text-slate-300">•</span>
              <span className="text-[15px] text-indigo-600 font-semibold">{user.reputation} điểm uy tín</span>
            </div>
          </div>

          <div className="flex gap-3 mt-6 md:mt-0 md:pb-2">
            <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer hover:-translate-y-0.5">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Chỉnh sửa
            </button>
            <button className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-all border border-slate-200 flex items-center gap-2 cursor-pointer hover:-translate-y-0.5 shadow-sm">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Chia sẻ
            </button>
          </div>
        </div>
      </div>

      <hr className="border-slate-200 my-2" />

      {/* Navigation Tabs */}
      <div className="flex gap-2 px-4 mt-2 overflow-x-auto no-scrollbar">
        {['Bài viết', 'Giới thiệu', 'Bạn bè', 'Tài liệu', 'Nhóm'].map((tab, i) => (
          <button
            key={tab}
            className={`px-5 py-3 rounded-xl font-semibold text-[15px] transition-all cursor-pointer whitespace-nowrap ${
              i === 0 ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Profile Content */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-[360px_1fr] gap-4 px-4">

        {/* Left Column */}
        <div className="space-y-4">
          {/* Intro Card */}
          <div className="glass rounded-3xl p-5 border border-slate-200">
            <h3 className="text-lg font-bold mb-4 text-slate-800">Giới thiệu</h3>
            <p className="text-center text-[15px] mb-4 text-slate-600">{user.bio}</p>

            <div className="space-y-3 text-[14px]">
              <div className="flex items-center gap-3 text-slate-600">
                <span className="text-xl">🎓</span>
                <span>Học tại <strong className="text-slate-800">{user.department}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <span className="text-xl">💻</span>
                <span>Ngành <strong className="text-slate-800">{user.major}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <span className="text-xl">📅</span>
                <span>Khóa <strong className="text-slate-800">{user.cohort}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <span className="text-xl">🆔</span>
                <span>MSSV: <strong className="text-slate-800">{user.studentId}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <span className="text-xl">📧</span>
                <span className="text-indigo-600">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="glass rounded-3xl p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Huy hiệu & Thành tích</h3>
            </div>
            <div className="space-y-3">
              {user.badges.map(badge => (
                <div key={badge.name} className={`flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors`}>
                  <span className="text-2xl drop-shadow-md">{badge.icon}</span>
                  <span className="font-semibold text-[14px] text-slate-800">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="glass rounded-3xl p-5 border border-slate-200">
            <h3 className="text-lg font-bold mb-4 text-slate-800">Kỹ năng</h3>
            <div className="flex flex-wrap gap-2">
              {user.skills.map(skill => (
                <span key={skill} className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-xl text-[13px] font-semibold hover:bg-indigo-100 transition-colors cursor-default">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="glass rounded-3xl p-5 border border-slate-200">
            <h3 className="text-lg font-bold mb-4 text-slate-800">Thống kê</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                <p className="text-[22px] font-bold text-indigo-600">{user.friends}</p>
                <p className="text-[12px] font-medium text-slate-500 mt-1">Bạn bè</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                <p className="text-[22px] font-bold text-emerald-500">{user.posts}</p>
                <p className="text-[12px] font-medium text-slate-500 mt-1">Bài viết</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                <p className="text-[22px] font-bold text-purple-500">{user.documents}</p>
                <p className="text-[12px] font-medium text-slate-500 mt-1">Tài liệu</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Posts */}
        <div className="space-y-4">
          {/* Create Post */}
          <div className="glass rounded-3xl p-5 border border-slate-200 flex gap-4 items-center">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200">
              <img src={user.avatar} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 bg-slate-50 rounded-full px-5 py-2.5 border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer text-slate-500 text-[14px] shadow-inner">
              Bạn đang nghĩ gì thế?
            </div>
          </div>

          {/* User Posts */}
          {[1, 2].map(post => (
            <div key={post} className="glass rounded-3xl overflow-hidden border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200">
                    <img src={user.avatar} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-semibold text-[15px] text-slate-800 leading-tight">{user.name}</p>
                    <p className="text-[12px] text-slate-500 mt-0.5">{post} giờ · 🌎</p>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer text-slate-400 hover:text-slate-600 transition-colors">•••</div>
              </div>
              <div className="px-5 pb-4 text-[14px] text-slate-800 leading-relaxed">
                <p>
                  {post === 1
                    ? 'Vừa hoàn thành đồ án cuối kỳ React! Cảm ơn nhóm đã cùng nhau cố gắng 🎉🔥'
                    : 'Chia sẻ tài liệu Cấu trúc dữ liệu cho anh em K15. Link trong comment nhé 📚'}
                </p>
              </div>
              <div className="px-5 pb-4">
                <img className="w-full rounded-2xl object-cover border border-slate-200" src={`https://images.unsplash.com/photo-${1600000000000 + post}?w=800&h=500&fit=crop`} />
              </div>
              
              <div className="px-5 py-3 flex justify-between items-center text-[13px] text-slate-500 border-b border-slate-200">
                <div className="flex items-center gap-1.5 cursor-pointer group">
                  <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white text-[10px] shadow-sm">👍</div>
                  <span className="ml-1 group-hover:text-indigo-600 transition-colors font-medium">{post === 1 ? '234' : '89'}</span>
                </div>
                <div className="flex gap-4">
                  <span className="hover:text-slate-800 cursor-pointer transition-colors">{post === 1 ? '45' : '12'} bình luận</span>
                  <span className="hover:text-slate-800 cursor-pointer transition-colors">{post === 1 ? '8' : '23'} chia sẻ</span>
                </div>
              </div>
              
              <div className="px-3 py-2 flex justify-between text-[13px] font-medium text-slate-500">
                <div className="flex-1 flex justify-center py-2.5 rounded-xl hover:bg-slate-100/80 hover:text-slate-800 cursor-pointer transition-colors gap-2"><span>👍</span> Thích</div>
                <div className="flex-1 flex justify-center py-2.5 rounded-xl hover:bg-slate-100/80 hover:text-slate-800 cursor-pointer transition-colors gap-2"><span>💬</span> Bình luận</div>
                <div className="flex-1 flex justify-center py-2.5 rounded-xl hover:bg-slate-100/80 hover:text-slate-800 cursor-pointer transition-colors gap-2"><span>🔗</span> Chia sẻ</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
