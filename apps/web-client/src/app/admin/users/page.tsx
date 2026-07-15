'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Shield, Ban, CheckCircle, Loader2, BadgeCheck } from 'lucide-react';
import api from '@/lib/api';

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedRole !== 'ALL') params.role = selectedRole;
      
      const res = await api.get('/admin/users', { params });
      // Giả sử API trả về { items: [...], total: ... }
      setUsers(res.data.items || res.data || []);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedRole]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const toggleBan = async (user: any) => {
    if (!window.confirm(`Bạn có muốn ${user.status === 'BANNED' ? 'unban' : 'ban'} user này?`)) return;
    try {
      const newStatus = user.status === 'BANNED' ? 'ACTIVE' : 'BANNED';
      await api.patch(`/admin/users/${user.id}/status`, { status: newStatus });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    } catch (err) {
      console.error(err);
      alert('Lỗi thao tác');
    }
  };

  const toggleBadge = async (user: any) => {
    try {
      await api.patch(`/admin/users/${user.id}/badge`);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, hasBlueBadge: !u.hasBlueBadge } : u));
    } catch (err) {
      console.error(err);
      alert('Lỗi thao tác');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-500 text-sm">Quản lý người dùng thực tế từ database.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search by name, email or ID..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select 
                className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="ALL">All Roles</option>
                <option value="STUDENT">Student</option>
                <option value="MODERATOR">Moderator</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
             <div className="flex justify-center items-center h-full py-20">
               <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
             </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white border-b border-gray-100 text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Verification</th>
                  <th className="px-6 py-4 font-semibold">Joined Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700">
                          {user.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 flex items-center gap-1">
                            {user.fullName}
                            {user.hasBlueBadge && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                          </p>
                          <p className="text-gray-500 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'MODERATOR' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {user.status === 'ACTIVE' && <div className="w-2 h-2 rounded-full bg-green-500" />}
                        {user.status === 'BANNED' && <div className="w-2 h-2 rounded-full bg-red-500" />}
                        {user.status === 'PENDING' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                        <span className="font-medium text-gray-700">{user.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.isVerified ? (
                        <span className="flex items-center gap-1 text-blue-600 font-bold text-xs bg-blue-50 px-2 py-1 rounded-md w-fit">
                          <CheckCircle className="w-3 h-3" /> VERIFIED
                        </span>
                      ) : (
                        <span className="text-gray-400 font-medium text-xs">Unverified</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => toggleBadge(user)}
                          className={`p-1.5 rounded-lg transition-colors ${user.hasBlueBadge ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`} 
                          title={user.hasBlueBadge ? 'Remove Blue Badge' : 'Add Blue Badge'}
                        >
                          <BadgeCheck className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Change Role">
                          <Shield className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => toggleBan(user)}
                          className={`p-1.5 rounded-lg transition-colors ${user.status === 'BANNED' ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`} 
                          title={user.status === 'BANNED' ? 'Unban User' : 'Ban User'}
                        >
                          {user.status === 'BANNED' ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
