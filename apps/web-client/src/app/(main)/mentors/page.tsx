"use client";

import { useState } from 'react';

interface Mentor {
  id: number;
  name: string;
  avatar: string;
  cohort: string;
  major: string;
  gpa: number;
  expertise: string[];
  rating: number;
  reviews: number;
  mentees: number;
  available: boolean;
  bio: string;
  badges: string[];
  schedule: { day: string; time: string }[];
}

const mentors: Mentor[] = [
  { id: 1, name: 'Phạm Thị D', avatar: 'https://i.pravatar.cc/150?img=9', cohort: 'K13', major: 'Kỹ thuật phần mềm', gpa: 3.9, expertise: ['React', 'NestJS', 'System Design'], rating: 4.9, reviews: 45, mentees: 12, available: true, bio: 'Đã làm intern tại VNG, có kinh nghiệm 3 năm React. Sẵn sàng hỗ trợ các em khóa dưới.', badges: ['🏆 Mentor xuất sắc', '⭐ Top 1%'], schedule: [{ day: 'T3', time: '18:00-20:00' }, { day: 'T5', time: '19:00-21:00' }] },
  { id: 2, name: 'Trần Văn B', avatar: 'https://i.pravatar.cc/150?img=41', cohort: 'K13', major: 'Khoa học dữ liệu', gpa: 3.8, expertise: ['Python', 'ML', 'TensorFlow'], rating: 4.7, reviews: 32, mentees: 8, available: true, bio: 'Nghiên cứu sinh AI, từng đạt giải nhì cuộc thi Data Science. Chuyên về Computer Vision.', badges: ['🧠 Chuyên gia AI'], schedule: [{ day: 'T7', time: '9:00-11:00' }] },
  { id: 3, name: 'Nguyễn Thị C', avatar: 'https://i.pravatar.cc/150?img=42', cohort: 'K14', major: 'An ninh mạng', gpa: 3.7, expertise: ['Cybersecurity', 'CTF', 'Linux'], rating: 4.6, reviews: 18, mentees: 5, available: false, bio: 'Thành viên đội tuyển CTF trường. Kinh nghiệm pentest và bug bounty.', badges: ['🛡️ Security Expert'], schedule: [{ day: 'T4', time: '15:00-17:00' }] },
  { id: 4, name: 'Hoàng Văn E', avatar: 'https://i.pravatar.cc/150?img=12', cohort: 'K13', major: 'Kỹ thuật phần mềm', gpa: 3.6, expertise: ['Java', 'Spring Boot', 'Docker'], rating: 4.5, reviews: 22, mentees: 7, available: true, bio: 'Backend developer, đã có 2 năm kinh nghiệm. Mentor cho các bạn học Java/Spring Boot.', badges: ['☕ Chuyên gia Java'], schedule: [{ day: 'T2', time: '17:00-19:00' }, { day: 'T6', time: '18:00-20:00' }] },
];

export default function MentorPage() {
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="fb-card p-4 mt-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🎓</span>
          <div>
            <h1 className="text-[24px] font-bold">Mentor Connect</h1>
            <p className="text-gray-500 text-[15px]">Kết nối với anh chị khóa trên, được dẫn dắt và hỗ trợ</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 bg-green-50 rounded-xl">
            <p className="text-[24px] font-bold text-green-600">{mentors.length}</p>
            <p className="text-[13px] text-gray-500">Mentor đang hoạt động</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <p className="text-[24px] font-bold text-blue-600">{mentors.reduce((a, m) => a + m.mentees, 0)}</p>
            <p className="text-[13px] text-gray-500">Mentee đang được dẫn dắt</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-xl">
            <p className="text-[24px] font-bold text-purple-600">4.7</p>
            <p className="text-[13px] text-gray-500">Đánh giá trung bình</p>
          </div>
        </div>
      </div>

      {/* Mentor List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {mentors.map(mentor => (
          <div key={mentor.id} className="fb-card p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedMentor(mentor)}>
            <div className="flex items-start gap-4">
              <div className="relative">
                <img src={mentor.avatar} className="w-16 h-16 rounded-full" />
                {mentor.available && (
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[17px]">{mentor.name}</h3>
                    <p className="text-[13px] text-gray-500">{mentor.cohort} · {mentor.major}</p>
                  </div>
                  <span className={`px-2 py-1 text-[12px] font-medium rounded-full ${mentor.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {mentor.available ? 'Sẵn sàng' : 'Bận'}
                  </span>
                </div>

                <div className="flex items-center gap-1 mt-1">
                  <span className="text-yellow-500">⭐</span>
                  <span className="font-semibold text-[14px]">{mentor.rating}</span>
                  <span className="text-[13px] text-gray-500">({mentor.reviews} đánh giá)</span>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {mentor.expertise.map(exp => (
                    <span key={exp} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[12px] font-medium">{exp}</span>
                  ))}
                </div>

                <div className="flex gap-1 mt-2">
                  {mentor.badges.map(badge => (
                    <span key={badge} className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full text-[11px] font-medium">{badge}</span>
                  ))}
                </div>

                <div className="flex gap-2 mt-3">
                  <button className="flex-1 px-3 py-2 bg-[#0866ff] hover:bg-[#0553e0] text-white text-[14px] font-semibold rounded-lg transition-colors cursor-pointer">
                    📅 Đặt lịch
                  </button>
                  <button className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[14px] font-semibold rounded-lg transition-colors cursor-pointer">
                    💬 Nhắn tin
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Detail */}
            {selectedMentor?.id === mentor.id && (
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                <p className="text-[14px] text-gray-700">{mentor.bio}</p>
                <div>
                  <p className="font-semibold text-[14px] mb-1">📅 Lịch rảnh:</p>
                  <div className="flex gap-2">
                    {mentor.schedule.map(s => (
                      <span key={s.day} className="px-3 py-1 bg-gray-100 rounded-lg text-[13px]">{s.day}: {s.time}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[13px] text-gray-500">
                  <span>🎓 GPA: {mentor.gpa}/4.0</span>
                  <span>👥 {mentor.mentees} mentee</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

