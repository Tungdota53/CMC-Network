'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../lib/api';

type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isSuspended: boolean;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await apiFetch('/api/users/admin/all');
        if (res.ok) setUsers(await res.json());
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSuspend = async (userId: string) => {
    const res = await apiFetch(`/api/users/admin/${userId}/suspend`, { method: 'PUT' });
    if (res.ok) {
      const updated = await res.json();
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: updated.isSuspended } : u));
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    const res = await apiFetch(`/api/users/admin/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: updated.role } : u));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Quản lý người dùng</h2>
          <p className="text-gray-400 mt-1">Quản lý và kiểm soát tài khoản trên hệ thống.</p>
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/50 text-gray-400 text-sm">
                <th className="p-4 font-medium">Tên</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Vai trò</th>
                <th className="p-4 font-medium">Trạng thái</th>
                <th className="p-4 font-medium">Ngày tham gia</th>
                <th className="p-4 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-800/80 transition-colors">
                  <td className="p-4 text-white font-medium">{user.fullName}</td>
                  <td className="p-4 text-gray-400">{user.email}</td>
                  <td className="p-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="bg-gray-900 border border-gray-700 text-gray-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="TEACHER">TEACHER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="CLUB_LEADER">CLUB_LEADER</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full border ${!user.isSuspended ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {!user.isSuspended ? 'Hoạt động' : 'Đình chỉ'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 text-sm">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleSuspend(user.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        user.isSuspended
                          ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                          : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      }`}
                    >
                      {user.isSuspended ? '🔓 Mở khóa' : '🔒 Đình chỉ'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
