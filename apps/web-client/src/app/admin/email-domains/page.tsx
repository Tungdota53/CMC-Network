'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Globe, Power, PowerOff, Edit3, Trash2, Plus, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function AdminDomainsPage() {
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDomains = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/email-domains');
      setDomains(res.data);
    } catch (err) {
      console.error('Failed to fetch email domains', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const toggleStatus = async (domain: any) => {
    if (!window.confirm(`Bạn muốn ${domain.isActive ? 'tạm ngưng' : 'kích hoạt'} domain ${domain.domain}?`)) return;
    try {
      await api.patch(`/admin/email-domains/${domain.id}/toggle`);
      setDomains(prev => prev.map(d => d.id === domain.id ? { ...d, isActive: !d.isActive } : d));
    } catch (err) {
      console.error(err);
      alert('Lỗi thao tác');
    }
  };

  const deleteDomain = async (id: string, domainName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn domain ${domainName}?`)) return;
    try {
      await api.delete(`/admin/email-domains/${id}`);
      setDomains(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
      alert('Lỗi khi xóa domain');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Tên miền Trường học (Email Domains)</h1>
          <p className="text-gray-500 text-sm">Quản lý các email domain được phép đăng ký tài khoản từ CSDL.</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Thêm Tên miền
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Tìm theo tên trường, domain..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
                  <th className="px-6 py-4 font-semibold">Tên miền</th>
                  <th className="px-6 py-4 font-semibold">Trường Đại học</th>
                  <th className="px-6 py-4 font-semibold">Trạng thái</th>
                  <th className="px-6 py-4 font-semibold text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {domains.map(domain => (
                  <tr key={domain.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-mono font-bold text-gray-900">
                        <Globe className="w-4 h-4 text-indigo-500" /> @{domain.domain}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">{domain.universityName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider
                        ${domain.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {domain.isActive ? 'Hoạt động' : 'Đang tắt'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => toggleStatus(domain)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title={domain.isActive ? 'Tạm ngưng' : 'Kích hoạt'}>
                          {domain.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                        <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Chỉnh sửa">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteDomain(domain.id, domain.domain)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa tên miền">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {domains.length === 0 && (
                   <tr>
                     <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                       Chưa có email domain nào được cấu hình.
                     </td>
                   </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
