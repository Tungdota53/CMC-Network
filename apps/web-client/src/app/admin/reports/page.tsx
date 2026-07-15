'use client';
import React, { useState, useEffect } from 'react';
import { Search, Filter, ShieldAlert, CheckCircle, XCircle, Trash2, Loader2, ClipboardList } from 'lucide-react';
import api from '@/lib/api';
import { extractList } from '@/lib/adapters';

export default function AdminReportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [targetTypeFilter, setTargetTypeFilter] = useState('ALL');
  const [reports, setReports] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchReports = async () => {
      try {
        setLoading(true);
        const [reportRes, auditRes] = await Promise.all([
          api.get('/admin/reports', { params: { status: statusFilter, targetType: targetTypeFilter, q: searchTerm || undefined } }),
          api.get('/admin/audit-logs', { params: { limit: 20 } }),
        ]);
        if (!cancelled) {
          setReports(extractList<any>(reportRes));
          setAuditLogs(extractList<any>(auditRes));
        }
      } catch (err) {
        console.error('Failed to fetch reports', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchReports();
    return () => { cancelled = true; };
  }, [statusFilter, targetTypeFilter, searchTerm]);

  const handleResolve = async (id: string, status: 'REVIEWED' | 'RESOLVED' | 'DISMISSED') => {
    if (!window.confirm(`Bạn muốn chuyển báo cáo sang ${status}?`)) return;
    try {
      await api.put(`/admin/reports/${id}/resolve`, { status, note: 'Processed by admin' });
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      alert('Lỗi xử lý');
    }
  };

  const handleDeleteContent = async (report: any) => {
    if (!window.confirm(`Xóa nội dung ${report.targetType} ${report.targetId}? Hành động này không thể hoàn tác.`)) return;
    try {
      await api.delete(`/admin/content/${report.targetType}/${report.targetId}`);
      await api.put(`/admin/reports/${report.id}/resolve`, { status: 'RESOLVED', note: 'Deleted reported content' });
      setReports(prev => prev.filter(r => r.id !== report.id));
    } catch (err) {
      console.error(err);
      alert('Lỗi xóa nội dung');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Báo cáo vi phạm (Reports)</h1>
          <p className="text-gray-500 text-sm">Quản lý và xử lý các báo cáo vi phạm cộng đồng từ cơ sở dữ liệu.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Tìm theo ID báo cáo..."
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Đang chờ xử lý (Pending)</option>
                <option value="REVIEWED">Đã xử lý (Reviewed)</option>
                <option value="DISMISSED">Bỏ qua (Dismissed)</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select 
                className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none"
                value={targetTypeFilter}
                onChange={(e) => setTargetTypeFilter(e.target.value)}
              >
                <option value="ALL">Tất cả loại</option>
                <option value="POST">Bài viết</option>
                <option value="COMMENT">Bình luận</option>
                <option value="USER">Người dùng</option>
                <option value="PRODUCT">Sản phẩm</option>
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
                  <th className="px-6 py-4 font-semibold">Mã BC</th>
                  <th className="px-6 py-4 font-semibold">Đối tượng</th>
                  <th className="px-6 py-4 font-semibold">Người báo cáo</th>
                  <th className="px-6 py-4 font-semibold">Lý do</th>
                  <th className="px-6 py-4 font-semibold">Trạng thái</th>
                  <th className="px-6 py-4 font-semibold">Thời gian</th>
                  <th className="px-6 py-4 font-semibold text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.map(report => (
                  <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-gray-600 text-xs">
                       {report.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      <div className="font-bold">{report.targetType}</div>
                      <div className="font-mono text-gray-400">{report.targetId?.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {report.reporter?.fullName || report.reporterId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[200px] truncate text-gray-600" title={report.reason}>
                        {report.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider
                        ${report.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
                          report.status === 'REVIEWED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(report.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {report.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleResolve(report.id, 'REVIEWED')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-200" title="Đã xem xét">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            {['POST', 'COMMENT', 'PRODUCT'].includes(report.targetType) && (
                              <button onClick={() => handleDeleteContent(report)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200" title="Xóa nội dung">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => handleResolve(report.id, 'DISMISSED')} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200" title="Bác bỏ báo cáo">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          Chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <ShieldAlert className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p>Không tìm thấy báo cáo nào phù hợp.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-indigo-500" /> Audit logs gần đây
        </h2>
        <div className="space-y-3">
          {auditLogs.map((log) => (
            <div key={log.id} className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3 last:border-0">
              <div>
                <p className="text-sm font-bold text-gray-800">{log.action}</p>
                <p className="text-xs text-gray-500">{log.actor?.fullName || log.actorId}</p>
              </div>
              <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString('vi-VN')}</span>
            </div>
          ))}
          {!auditLogs.length && <p className="text-sm text-gray-500">Chưa có audit log.</p>}
        </div>
      </div>
    </div>
  );
}
