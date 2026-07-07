"use client";

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

type StudyGroup = {
  id: string;
  type?: string;
  memberCount?: number;
  maxMembers?: number;
  title: string;
  subject?: string;
  location?: string;
  creator?: { fullName?: string | null };
};

type StudyRequest = {
  id: string;
  title: string;
  type?: string;
  user?: { fullName?: string | null };
};

export default function StudyPage() {
  const [activeTab, setActiveTab] = useState<'GROUPS' | 'REQUESTS'>('GROUPS');
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [requests, setRequests] = useState<StudyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'GROUPS') {
        const res = await fetch('/api/study-groups');
        if (res.ok) {
          const data = await res.json();
          setGroups(Array.isArray(data) ? data : []);
        }
      } else {
        const res = await fetch('/api/study-groups/requests');
        if (res.ok) {
          const data = await res.json();
          setRequests(Array.isArray(data) ? data : []);
        }
      }
    } catch {
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchData]);

  const handleCreateGroup = async () => {
    // Scaffold creation for testing
    const title = prompt('Tên nhóm học:');
    if (!title) return;
    try {
      const res = await fetch('/api/study-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subject: 'Toán Cao Cấp',
          location: 'Thư viện',
          maxMembers: 5,
          scheduledTime: new Date().toISOString(),
          type: 'STUDY'
        }),
      });
      if (res.ok) {
        toast.success('Tạo nhóm thành công, Chat tự động đã được thiết lập!');
        fetchData();
      }
    } catch {
      toast.error('Tạo nhóm thất bại');
    }
  };

  const handleCreateRequest = async () => {
    const title = prompt('Tiêu đề tìm bạn:');
    if (!title) return;
    try {
      const res = await fetch('/api/study-groups/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: 'Cần tìm bạn học chung',
          type: 'FIND_PARTNER'
        }),
      });
      if (res.ok) {
        toast.success('Tạo yêu cầu thành công!');
        fetchData();
      }
    } catch {
      toast.error('Tạo yêu cầu thất bại');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header */}
      <div className="px-8 pt-8 pb-4">
        <h1 className="text-3xl font-bold text-slate-800">Góc Học Tập</h1>
        <p className="text-slate-500 mt-1">Tìm nhóm học, bạn học và gia sư để cùng tiến bộ</p>
        
        {/* Tabs */}
        <div className="flex gap-6 mt-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('GROUPS')}
            className={`flex-1 sm:flex-none relative px-6 py-4 font-semibold text-[15px] transition-colors ${activeTab === 'GROUPS' ? 'text-indigo-600 dark:text-indigo-400' : 'text-token-secondary hover:text-token-primary'}`}
          >
            Nhóm học
            {activeTab === 'GROUPS' && (
              <motion.div layoutId="studyTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('REQUESTS')}
            className={`flex-1 sm:flex-none relative px-6 py-4 font-semibold text-[15px] transition-colors ${activeTab === 'REQUESTS' ? 'text-indigo-600 dark:text-indigo-400' : 'text-token-secondary hover:text-token-primary'}`}
          >
            Yêu cầu tìm bạn
            {activeTab === 'REQUESTS' && (
              <motion.div layoutId="studyTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center items-center h-32 text-slate-400">Đang tải...</div>
        ) : activeTab === 'GROUPS' ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-700">Tất cả nhóm học</h2>
              <button onClick={handleCreateGroup} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-all flex items-center gap-2">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                Tạo nhóm mới
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.length === 0 && <p className="text-slate-500 col-span-full">Chưa có nhóm học nào. Hãy là người đầu tiên tạo nhóm!</p>}
              {groups.map(g => (
                <div key={g.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg">{g.type}</span>
                    <span className="text-xs font-medium text-slate-500">{g.memberCount}/{g.maxMembers} thành viên</span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mb-1">{g.title}</h3>
                  <p className="text-sm text-slate-600 mb-4">{g.subject} • {g.location}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200"></div>
                      <span className="text-xs font-medium text-slate-600">{g.creator?.fullName || 'Anonymous'}</span>
                    </div>
                    <button className="text-indigo-600 text-sm font-semibold hover:text-indigo-700">Tham gia</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-700">Yêu cầu tìm bạn</h2>
              <button onClick={handleCreateRequest} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl shadow-sm transition-all flex items-center gap-2">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                Tạo yêu cầu
              </button>
            </div>

            <div className="space-y-4">
              {requests.length === 0 && <p className="text-slate-500">Chưa có yêu cầu nào.</p>}
              {requests.map(r => (
                <div key={r.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center group hover:border-emerald-200 transition-colors">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{r.title}</h3>
                      <p className="text-sm text-slate-500">{r.user?.fullName} • {r.type}</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-slate-50 text-slate-700 font-semibold rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                    Kết nối
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
