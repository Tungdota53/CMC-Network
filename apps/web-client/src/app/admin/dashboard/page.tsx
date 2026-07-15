'use client';
import React from 'react';
import { StatsCard } from '@/components/admin/StatsCard';
import { Users, UserCheck, Flag, FileText } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const DAU_DATA = [
  { date: 'Mon', dau: 1200, mau: 5000 },
  { date: 'Tue', dau: 1350, mau: 5100 },
  { date: 'Wed', dau: 1100, mau: 5150 },
  { date: 'Thu', dau: 1450, mau: 5200 },
  { date: 'Fri', dau: 1800, mau: 5400 },
  { date: 'Sat', dau: 2200, mau: 5600 },
  { date: 'Sun', dau: 2100, mau: 5800 },
];

const GROWTH_DATA = [
  { month: 'Jan', users: 1000 },
  { month: 'Feb', users: 1500 },
  { month: 'Mar', users: 2200 },
  { month: 'Apr', users: 3800 },
  { month: 'May', users: 5000 },
  { month: 'Jun', users: 8500 },
];

const FACULTY_DATA = [
  { name: 'CNTT', value: 4500, color: '#4F46E5' },
  { name: 'QTKD', value: 2000, color: '#10B981' },
  { name: 'Thiết kế', value: 1200, color: '#F59E0B' },
  { name: 'Ngôn ngữ', value: 800, color: '#8B5CF6' },
];

export default function AdminDashboardPage() {
  const chartsReady = React.useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-gray-900">Dashboard Overview</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Users" value="8,500" subtitle="Registered Users" trend={12.5} icon={Users} color="indigo" />
        <StatsCard title="Active Today" value="3,200" subtitle="DAU" trend={5.2} icon={UserCheck} color="green" />
        <StatsCard title="New This Week" value="150" subtitle="Signups" trend={-2.4} icon={FileText} color="amber" />
        <StatsCard title="Pending Reports" value="12" subtitle="Require action" trend={18.0} icon={Flag} color="red" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DAU/MAU Line Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Active Users (DAU/MAU)</h3>
          <div className="h-[300px] w-full">
            {chartsReady ? <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DAU_DATA} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="dau" name="Daily Active" stroke="#4F46E5" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="mau" name="Monthly Active" stroke="#93C5FD" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer> : <div className="h-full w-full rounded-xl bg-gray-50" />}
          </div>
        </div>

        {/* User Growth Bar Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">User Growth (YTD)</h3>
          <div className="h-[300px] w-full">
            {chartsReady ? <ResponsiveContainer width="100%" height="100%">
              <BarChart data={GROWTH_DATA} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="users" name="Total Users" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer> : <div className="h-full w-full rounded-xl bg-gray-50" />}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Faculty Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-1">
          <h3 className="font-bold text-gray-900 mb-6">Faculty Distribution</h3>
          <div className="h-[250px] w-full flex items-center justify-center relative">
            {chartsReady ? <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={FACULTY_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {FACULTY_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer> : <div className="h-full w-full rounded-xl bg-gray-50" />}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
              <span className="text-2xl font-black text-gray-900">8.5k</span>
              <span className="text-xs font-medium text-gray-400">Total</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
             {FACULTY_DATA.map(f => (
               <div key={f.name} className="flex items-center gap-2 text-xs text-gray-600">
                 <span className="w-3 h-3 rounded-full" style={{ backgroundColor: f.color }} />
                 {f.name}
               </div>
             ))}
          </div>
        </div>

        {/* Recent Reports Table */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Recent Reports</h3>
            <button className="text-sm font-bold text-indigo-600 hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-l-lg">ID</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium rounded-r-lg">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { id: '#REP-01', type: 'Product', reason: 'Scam', status: 'PENDING', date: '2 mins ago' },
                  { id: '#REP-02', type: 'Post', reason: 'Spam', status: 'REVIEWED', date: '1 hr ago' },
                  { id: '#REP-03', type: 'Event', reason: 'Inappropriate', status: 'DISMISSED', date: '3 hrs ago' },
                ].map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4 font-mono text-gray-900">{r.id}</td>
                    <td className="px-4 py-4 text-gray-600">{r.type}</td>
                    <td className="px-4 py-4 text-gray-600">{r.reason}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider
                        ${r.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
                          r.status === 'REVIEWED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-500 text-xs">{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
