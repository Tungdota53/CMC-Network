"use client";

import { motion } from 'framer-motion';

const questCards = [
  { role: 'Học nhanh', title: 'Chốt 45 phút Xác suất', result: 'Ghép với 2 bạn cùng môn + bộ đề hot', icon: '⚡', xp: '+120 XP', progress: 78 },
  { role: 'Tạo giá trị', title: 'Đăng 1 tài liệu sạch', result: 'AI tóm tắt, gắn tag, đề xuất người cần', icon: '📎', xp: '+80 XP', progress: 48 },
  { role: 'Kết nối', title: 'Vào micro-event AI Club', result: 'Check-in 20 phút, nhận badge cộng đồng', icon: '🛰️', xp: '+1 Badge', progress: 88 },
];

const identityModes = [
  { label: 'Scholar', value: 'Tối ưu điểm số', icon: '🎓' },
  { label: 'Builder', value: 'Tối ưu project', icon: '🛠️' },
  { label: 'Connector', value: 'Tối ưu network', icon: '🤝' },
];

const campusDeck = [
  { title: 'Study Sprint', subtitle: '45 phút tập trung', stat: '6 phòng mở', icon: '⏱️' },
  { title: 'Skill Swap', subtitle: 'Đổi kỹ năng với bạn khác', stat: '12 kèo', icon: '🔁' },
  { title: 'Lost & Found AI', subtitle: 'Tìm đồ / tìm người / tìm nhóm', stat: '9 tín hiệu', icon: '🧭' },
];

const missions = [
  { title: 'Tìm partner học OOP', reward: '+120 XP', progress: 72 },
  { title: 'Upload tài liệu tốt tuần này', reward: '+80 XP', progress: 45 },
  { title: 'Check-in sự kiện AI Club', reward: '+1 Badge', progress: 88 },
];

const campusSignals = [
  '43 sinh viên đang tìm tài liệu Xác suất thống kê',
  '6 nhóm học Java mở trong 2 giờ tới',
  'Mentor Data Science online lúc 20:00',
];

const studyMatches = [
  { name: 'Minh Anh', goal: 'Qua môn OOP điểm A', time: '19:30 hôm nay', tags: ['Java', 'Thảo luận', 'Năm 2'] },
  { name: 'Quang Huy', goal: 'Làm project React', time: 'Cuối tuần', tags: ['React', 'Git', 'Pair code'] },
  { name: 'Gia Bảo', goal: 'Ôn Cấu trúc dữ liệu', time: 'Chiều mai', tags: ['DSA', 'Im lặng', 'Flashcard'] },
];

export default function PulsePage() {
  return (
    <div className="w-full flex flex-col gap-4 animate-fade-rise">
      <section className="w-full glass rounded-none sm:rounded-3xl border-x-0 sm:border-x p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full surface-subtle border border-slate-200 dark:border-slate-700 text-[12px] font-bold text-indigo-600 dark:text-indigo-300 mb-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                </span>
                LIVE CAMPUS PULSE
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-token-primary leading-tight">
                Trường đang có gì nóng,
                <span className="brand-text block">biết ngay trong 10 giây.</span>
              </h1>
              <p className="mt-2 text-sm sm:text-[15px] text-token-secondary leading-relaxed max-w-xl">
                Radar sinh viên CMC: nhóm học, sự kiện, tài liệu hot, mentor online và nhiệm vụ AI cá nhân hóa.
              </p>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-2 text-right">
              <div className="text-[11px] font-bold uppercase tracking-widest text-token-tertiary">Campus heat</div>
              <div className="text-4xl font-black brand-text">87%</div>
              <div className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-xs font-bold border border-indigo-100 dark:border-indigo-500/20">Rất sôi động</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="surface-subtle rounded-3xl border border-slate-200 dark:border-slate-700 p-4 relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)', backgroundSize: '34px 34px' }} />
              <div className="relative z-10 flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-black text-token-primary">AI Campus Quest</h2>
                  <p className="text-xs text-token-tertiary mt-0.5">Không phải feed. Mỗi ngày AI biến campus thành nhiệm vụ cá nhân.</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-token-secondary">Season 01 · Day 7</span>
              </div>

              <div className="relative z-10 grid grid-cols-1 gap-3">
                <div className="rounded-[2rem] border border-slate-200 dark:border-slate-700 bg-white/45 dark:bg-slate-950/25 p-4 overflow-hidden relative">
                  <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-indigo-500/10 blur-2xl" />
                  <div className="absolute -left-20 bottom-0 h-52 w-52 rounded-full bg-purple-500/10 blur-2xl" />
                  <div className="relative flex h-full flex-col">
                    <div className="text-[11px] font-black uppercase tracking-widest text-token-tertiary">Chọn chế độ hôm nay</div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {identityModes.map((mode, index) => (
                        <motion.button
                          key={mode.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.07 }}
                          className="rounded-2xl surface border border-slate-200 dark:border-slate-700 p-3 text-left hover:-translate-y-0.5 transition-transform first:border-indigo-300 dark:first:border-indigo-500/40"
                        >
                          <div className="text-2xl">{mode.icon}</div>
                          <div className="mt-2 text-xs font-black text-token-primary">{mode.label}</div>
                          <div className="mt-1 text-[10px] font-bold text-token-tertiary leading-tight">{mode.value}</div>
                        </motion.button>
                      ))}
                    </div>
                    <div className="mt-5 rounded-[1.7rem] bg-indigo-600 dark:bg-indigo-500 p-4 text-white shadow-lg shadow-indigo-500/20">
                      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-center">
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-widest text-white/70">AI đề xuất</div>
                          <h3 className="mt-2 text-2xl font-black leading-tight">Scholar Mode</h3>
                          <p className="mt-2 text-sm text-white/80 leading-relaxed">Hôm nay nên ưu tiên học. Có 3 tín hiệu trùng môn bạn đang yếu.</p>
                        </div>
                        <button className="rounded-2xl bg-white/95 px-5 py-3 text-sm font-black text-indigo-700 hover:-translate-y-0.5 transition-transform">Bắt đầu quest 90 phút</button>
                      </div>
                    </div>
                    <div className="mt-auto pt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-2xl surface border border-slate-200 dark:border-slate-700 p-2">
                        <div className="text-lg font-black brand-text">7</div>
                        <div className="text-[10px] font-bold text-token-tertiary">streak</div>
                      </div>
                      <div className="rounded-2xl surface border border-slate-200 dark:border-slate-700 p-2">
                        <div className="text-lg font-black brand-text">1.8k</div>
                        <div className="text-[10px] font-bold text-token-tertiary">XP</div>
                      </div>
                      <div className="rounded-2xl surface border border-slate-200 dark:border-slate-700 p-2">
                        <div className="text-lg font-black brand-text">#12</div>
                        <div className="text-[10px] font-bold text-token-tertiary">rank</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 dark:border-slate-700 bg-white/45 dark:bg-slate-950/25 p-3">
                  <div className="flex items-center justify-between px-1 pb-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-token-tertiary">Quest deck</span>
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-300">3 nhiệm vụ AI</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {questCards.map((quest, index) => (
                  <motion.div
                    key={quest.title}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="group rounded-2xl surface border border-slate-200 dark:border-slate-700 p-3 hover:-translate-y-0.5 transition-transform"
                  >
                    <div className="flex h-full flex-col gap-3">
                      <div className="shrink-0 h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-2xl">
                        {quest.icon}
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col">
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-300">{quest.role}</div>
                        <div className="mt-1 font-black text-sm text-token-primary leading-tight">{quest.title}</div>
                        <div className="mt-1 text-xs text-token-secondary leading-relaxed">{quest.result}</div>
                        <span className="mt-3 w-fit rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 text-[10px] font-black text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20">{quest.xp}</span>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                          <div className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400" style={{ width: `${quest.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {campusDeck.map((card) => (
                      <div key={card.title} className="rounded-2xl surface-subtle border border-slate-200 dark:border-slate-700 p-3">
                        <div className="text-xl">{card.icon}</div>
                        <div className="mt-2 text-xs font-black text-token-primary">{card.title}</div>
                        <div className="mt-1 text-[10px] text-token-secondary leading-tight">{card.subtitle}</div>
                        <div className="mt-2 text-[10px] font-black text-indigo-600 dark:text-indigo-300">{card.stat}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="surface-subtle rounded-3xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-black text-token-primary">AI Mission hôm nay</h2>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300">Streak 7 ngày</span>
                </div>
                <div className="space-y-3">
                  {missions.map((mission) => (
                    <div key={mission.title}>
                      <div className="flex items-center justify-between text-sm gap-3">
                        <span className="font-semibold text-token-primary truncate">{mission.title}</span>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300 shrink-0">{mission.reward}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mt-2">
                        <div className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400" style={{ width: `${mission.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="surface-subtle rounded-3xl border border-slate-200 dark:border-slate-700 p-4">
                <h2 className="font-black text-token-primary mb-3">Campus Signals</h2>
                <div className="space-y-2">
                  {campusSignals.map((signal, index) => (
                    <div key={signal} className="flex items-start gap-2 text-sm text-token-secondary">
                      <span className="mt-0.5 text-indigo-500">{index === 0 ? '🔥' : index === 1 ? '⚡' : '🟣'}</span>
                      <span>{signal}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {studyMatches.map((match) => (
          <div key={match.name} className="glass rounded-3xl border-x-0 sm:border-x p-4 flex gap-3 items-start group hover:-translate-y-0.5 transition-transform">
            <img src={`https://i.pravatar.cc/120?u=${match.name}`} className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700" alt="" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-token-primary truncate">{match.name}</h3>
                <span className="text-[11px] font-bold text-token-tertiary shrink-0">Study Match</span>
              </div>
              <p className="text-sm text-token-secondary mt-1">{match.goal}</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-300 font-bold mt-1">{match.time}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {match.tags.map((tag) => <span key={tag} className="px-2 py-1 rounded-full surface border border-slate-200 dark:border-slate-700 text-[11px] text-token-secondary">{tag}</span>)}
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
