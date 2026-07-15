'use client';
import React, { useState, useEffect } from 'react';
import { Search, FileText, CheckCircle, XCircle, Eye, Download, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function AdminMaterialsPage() {
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchMaterials = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/materials');
        const allMats = res.data.items || res.data || [];
        if (!cancelled) {
          setMaterials(allMats.filter((m: any) => m.status === statusFilter));
        }
      } catch (err) {
        console.error('Failed to fetch materials', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchMaterials();
    return () => { cancelled = true; };
  }, [statusFilter]);

  const updateStatus = async (id: string, newStatus: string) => {
    if (!window.confirm(`Bạn có chắc muốn ${newStatus === 'APPROVED' ? 'duyệt' : 'từ chối'} tài liệu này?`)) return;
    try {
      await api.patch(`/admin/materials/${id}/status`, { status: newStatus });
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error(err);
      alert('Lỗi khi cập nhật trạng thái');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Duyệt Tài Liệu (Materials)</h1>
          <p className="text-gray-500 text-sm">Kiểm duyệt các tài liệu sinh viên upload thực tế từ database.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Tìm theo tên tài liệu..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button 
              onClick={() => setStatusFilter('PENDING')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${statusFilter === 'PENDING' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Chờ duyệt
            </button>
            <button 
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${statusFilter === 'APPROVED' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Đã duyệt
            </button>
            <button 
              onClick={() => setStatusFilter('REJECTED')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${statusFilter === 'REJECTED' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Từ chối
            </button>
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
                  <th className="px-6 py-4 font-semibold">Tài liệu</th>
                  <th className="px-6 py-4 font-semibold">Môn học</th>
                  <th className="px-6 py-4 font-semibold">Người đăng</th>
                  <th className="px-6 py-4 font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {materials.map(material => (
                  <tr key={material.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 max-w-[300px] truncate">{material.title}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{new Date(material.createdAt).toLocaleString('vi-VN')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">{material.subjectId || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600">{material.uploader?.fullName || 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Xem trước">
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {material.status === 'PENDING' && (
                          <>
                            <div className="w-px h-5 bg-gray-200 mx-1"></div>
                            <button onClick={() => updateStatus(material.id, 'APPROVED')} className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 font-bold rounded-lg transition-colors flex items-center gap-1.5" title="Duyệt tài liệu">
                              <CheckCircle className="w-4 h-4" /> Duyệt
                            </button>
                            <button onClick={() => updateStatus(material.id, 'REJECTED')} className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 font-bold rounded-lg transition-colors flex items-center gap-1.5" title="Từ chối tài liệu">
                              <XCircle className="w-4 h-4" /> Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {materials.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      <p>Không có tài liệu nào trong trạng thái này.</p>
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
