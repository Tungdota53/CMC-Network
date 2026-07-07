"use client";

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type Analytics = {
  users: { total: number; dau: number; mau: number; newThisWeek: number; suspended: number };
  content: { posts: number; postsThisWeek: number; comments: number; materials: number; products: number };
  moderation: { pendingReports: number };
};

type GrowthData = { date: string; users: number; posts: number };

type Report = {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter?: { fullName?: string };
};

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [growth, setGrowth] = useState<GrowthData[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, growthRes, reportsRes] = await Promise.all([
        apiFetch('/admin/analytics'),
        apiFetch('/admin/growth?days=14'),
        apiFetch('/admin/reports?status=PENDING')
      ]);

      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (growthRes.ok) setGrowth(await growthRes.json());
      if (reportsRes.ok) setReports(await reportsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDashboard]);

  const handleResolveReport = async (reportId: string, status: string) => {
    try {
      const res = await apiFetch(`/admin/reports/${reportId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== reportId));
        if (analytics) {
          setAnalytics({ ...analytics, moderation: { pendingReports: Math.max(0, analytics.moderation.pendingReports - 1) } });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteContent = async (targetType: string, targetId: string, reportId: string) => {
    if (!window.confirm('Chắc chắn muốn xóa nội dung vi phạm này?')) return;
    try {
      // DELETE content
      const delRes = await apiFetch(`/admin/content/${targetType}/${targetId}`, { method: 'DELETE' });
      if (delRes.ok) {
        // Resolve report
        await handleResolveReport(reportId, 'RESOLVED');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Đang tải dữ liệu dashboard...</div>;
  }

  const stats = analytics ? [
    { title: 'Total Users', value: analytics.users.total, trend: `+${analytics.users.newThisWeek} tuần này`, isPositive: true, icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: 'from-blue-500 to-cyan-400' },
    { title: 'DAU / MAU', value: `${analytics.users.dau} / ${analytics.users.mau}`, trend: 'Active', isPositive: true, icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01', color: 'from-emerald-400 to-green-500' },
    { title: 'Active Posts', value: analytics.content.posts, trend: `+${analytics.content.postsThisWeek} tuần này`, isPositive: true, icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15M9 11l3 3L22 4', color: 'from-purple-500 to-pink-500' },
    { title: 'Pending Reports', value: analytics.moderation.pendingReports, trend: 'Cần xử lý', isPositive: analytics.moderation.pendingReports === 0, icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: 'from-orange-500 to-red-500' },
  ] : [];

  const chartData = growth.map(g => ({
    name: new Date(g.date).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' }),
    Users: g.users,
    Posts: g.posts
  })).reverse();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Overview</h2>
          <p className="text-gray-400 mt-2 font-medium">Hệ thống đang hoạt động ổn định. Chào mừng trở lại, Admin!</p>
        </div>
        <button onClick={loadDashboard} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all duration-300 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:-translate-y-1">
          Làm mới
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl relative overflow-hidden group hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)] hover:bg-white/[0.05]">
            <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${stat.color} rounded-full opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-300`}></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-gray-400 text-sm font-bold tracking-wide uppercase">{stat.title}</h3>
              <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20 shadow-lg`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} /></svg>
              </div>
            </div>
            <div className="flex items-baseline gap-4 relative z-10">
              <span className="text-4xl font-black text-white drop-shadow-md">{stat.value}</span>
              <span className={`text-sm font-bold px-2 py-1 rounded-md ${stat.isPositive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white/[0.02] backdrop-blur-xl border border-white/10 p-8 rounded-3xl relative shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
            Tăng trưởng 14 ngày qua
          </h3>
          <div className="w-full h-[350px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '0.75rem' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="Users" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Posts" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
               <div className="w-full h-full flex items-center justify-center text-gray-500">Chưa có dữ liệu biểu đồ</div>
            )}
          </div>
        </div>
        
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.2)] flex flex-col h-full">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)]"></span>
            Hàng đợi báo cáo ({reports.length})
          </h3>
          <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2">
            {reports.length === 0 ? (
               <p className="text-gray-400 text-center py-8">Không có báo cáo nào cần xử lý.</p>
            ) : reports.map(report => (
              <div key={report.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 text-[11px] font-bold rounded-full uppercase tracking-wider">{report.targetType}</span>
                  <span className="text-[12px] text-gray-500">{new Date(report.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <p className="text-[14px] text-gray-300 mb-1"><span className="font-semibold text-gray-200">{report.reporter?.fullName || 'Người dùng'}</span> báo cáo vi phạm:</p>
                <p className="text-[14px] font-medium text-white bg-white/5 p-2 rounded-xl mb-3">{report.reason}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleDeleteContent(report.targetType, report.targetId, report.id)} className="flex-1 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 text-[12px] font-bold rounded-lg transition-colors border border-red-500/30">
                    Xóa nội dung
                  </button>
                  <button onClick={() => handleResolveReport(report.id, 'DISMISSED')} className="flex-1 py-1.5 bg-gray-500/20 hover:bg-gray-500/40 text-gray-300 text-[12px] font-bold rounded-lg transition-colors border border-gray-500/30">
                    Bỏ qua
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
