import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, Award, FileText, Code, CheckCircle, ExternalLink, Calendar, PlusCircle, LayoutGrid, Link as LinkIcon } from 'lucide-react';
import { apiFetch } from '../lib/api';
import toast from 'react-hot-toast';

type Skill = { id: string, skill: string, level?: string };
type Achievement = { id: string, title: string, description?: string, earnedAt?: string };
type Certificate = { id: string, name: string, issuer: string, issuedAt: string, credentialUrl?: string };
type Project = { id: string, title: string, description?: string, techStack?: string[], githubUrl?: string, demoUrl?: string, createdAt?: string };

type PortfolioData = {
  skills: Skill[];
  achievements: Achievement[];
  certificates: Certificate[];
  projects: Project[];
};

export default function Portfolio({ userId, isOwner }: { userId: string, isOwner: boolean }) {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [activeModal, setActiveModal] = useState<'skill' | 'achievement' | 'certificate' | 'project' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [skillForm, setSkillForm] = useState({ skill: '', level: 'beginner' });
  const [achievementForm, setAchievementForm] = useState({ title: '', description: '' });
  const [certForm, setCertForm] = useState({ name: '', issuer: '', issuedAt: '', credentialUrl: '' });
  const [projectForm, setProjectForm] = useState({ title: '', description: '', techStack: '', githubUrl: '', demoUrl: '' });

  const loadData = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/users/${userId}/portfolio`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        toast.error('Không thể tải Portfolio');
      }
    } catch {
      toast.error('Lỗi mạng khi tải Portfolio');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  const handleDelete = async (type: string, id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mục này?')) return;
    try {
      const res = await apiFetch(`/api/users/${userId}/${type}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã xóa thành công');
        loadData();
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Xóa thất bại');
      }
    } catch {
      toast.error('Lỗi mạng');
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/users/${userId}/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skillForm)
      });
      if (res.ok) {
        toast.success('Đã thêm kỹ năng');
        setActiveModal(null);
        setSkillForm({ skill: '', level: 'beginner' });
        loadData();
      } else {
        const err = await res.json();
        toast.error(Array.isArray(err.message) ? err.message.join(', ') : err.message || 'Thêm thất bại');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/users/${userId}/achievements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(achievementForm)
      });
      if (res.ok) {
        toast.success('Đã thêm thành tựu');
        setActiveModal(null);
        setAchievementForm({ title: '', description: '' });
        loadData();
      } else {
        const err = await res.json();
        toast.error(Array.isArray(err.message) ? err.message.join(', ') : err.message || 'Thêm thất bại');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCert = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/users/${userId}/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...certForm,
          issuedAt: certForm.issuedAt ? new Date(certForm.issuedAt).toISOString() : undefined
        })
      });
      if (res.ok) {
        toast.success('Đã thêm chứng chỉ');
        setActiveModal(null);
        setCertForm({ name: '', issuer: '', issuedAt: '', credentialUrl: '' });
        loadData();
      } else {
        const err = await res.json();
        toast.error(Array.isArray(err.message) ? err.message.join(', ') : err.message || 'Thêm thất bại');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/users/${userId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...projectForm,
          techStack: projectForm.techStack.split(',').map(s => s.trim()).filter(Boolean)
        })
      });
      if (res.ok) {
        toast.success('Đã thêm dự án');
        setActiveModal(null);
        setProjectForm({ title: '', description: '', techStack: '', githubUrl: '', demoUrl: '' });
        loadData();
      } else {
        const err = await res.json();
        toast.error(Array.isArray(err.message) ? err.message.join(', ') : err.message || 'Thêm thất bại');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center py-12">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) return <div className="text-center py-8 text-slate-500">Không có dữ liệu.</div>;

  return (
    <div className="space-y-8 animate-fade-rise">
      {/* Kỹ năng */}
      <section className="glass p-6 border border-slate-200">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <CheckCircle className="text-indigo-600" size={20} />
            Kỹ năng chuyên môn
          </h3>
          {isOwner && (
            <button onClick={() => setActiveModal('skill')} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transition-colors" title="Thêm kỹ năng">
              <Plus size={20} />
            </button>
          )}
        </div>
        {data.skills.length === 0 ? (
          <p className="text-sm text-slate-500 italic">Chưa có kỹ năng nào được thêm.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.skills.map(s => (
              <div key={s.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-100 group">
                <span>{s.skill}</span>
                {s.level && <span className="text-xs text-indigo-400 font-normal">({s.level})</span>}
                {isOwner && (
                  <button onClick={() => handleDelete('skills', s.id)} className="ml-1 opacity-0 group-hover:opacity-100 text-indigo-400 hover:text-red-500 transition-opacity">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Chứng chỉ */}
      <section className="glass p-6 border border-slate-200">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <FileText className="text-emerald-600" size={20} />
            Chứng chỉ & Bằng cấp
          </h3>
          {isOwner && (
            <button onClick={() => setActiveModal('certificate')} className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-full transition-colors" title="Thêm chứng chỉ">
              <Plus size={20} />
            </button>
          )}
        </div>
        {data.certificates.length === 0 ? (
          <p className="text-sm text-slate-500 italic">Chưa có chứng chỉ nào.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.certificates.map(c => (
              <div key={c.id} className="flex flex-col p-4 bg-slate-50 border border-slate-200 rounded-2xl group relative">
                {isOwner && (
                  <button onClick={() => handleDelete('certificates', c.id)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-1 shadow-sm">
                    <X size={14} />
                  </button>
                )}
                <h4 className="font-bold text-slate-800 pr-6">{c.name}</h4>
                <p className="text-sm text-slate-600 mt-1">{c.issuer}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                  {c.issuedAt && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {new Date(c.issuedAt).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                  {c.credentialUrl && (
                    <a href={c.credentialUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-emerald-600 hover:underline">
                      <ExternalLink size={12} /> Link xác nhận
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Dự án */}
      <section className="glass p-6 border border-slate-200">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Code className="text-blue-600" size={20} />
            Dự án tiêu biểu
          </h3>
          {isOwner && (
            <button onClick={() => setActiveModal('project')} className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors" title="Thêm dự án">
              <Plus size={20} />
            </button>
          )}
        </div>
        {data.projects.length === 0 ? (
          <p className="text-sm text-slate-500 italic">Chưa có dự án nào được chia sẻ.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {data.projects.map(p => (
              <div key={p.id} className="flex flex-col p-5 bg-slate-50 border border-slate-200 rounded-2xl group relative">
                {isOwner && (
                  <button onClick={() => handleDelete('projects', p.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-1 shadow-sm">
                    <X size={14} />
                  </button>
                )}
                <h4 className="font-bold text-slate-800 text-base pr-6">{p.title}</h4>
                {p.description && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{p.description}</p>}
                
                {p.techStack && p.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {p.techStack.map(tech => (
                      <span key={tech} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded text-xs font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-200">
                  {p.githubUrl && (
                    <a href={p.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-slate-700 hover:text-blue-600 transition-colors">
                      <LinkIcon size={16} /> Source Code
                    </a>
                  )}
                  {p.demoUrl && (
                    <a href={p.demoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-slate-700 hover:text-blue-600 transition-colors">
                      <LayoutGrid size={16} /> Live Demo
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Thành tựu */}
      <section className="glass p-6 border border-slate-200">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Award className="text-yellow-600" size={20} />
            Thành tích nổi bật
          </h3>
          {isOwner && (
            <button onClick={() => setActiveModal('achievement')} className="text-yellow-600 hover:bg-yellow-50 p-2 rounded-full transition-colors" title="Thêm thành tựu">
              <Plus size={20} />
            </button>
          )}
        </div>
        {data.achievements.length === 0 ? (
          <p className="text-sm text-slate-500 italic">Chưa có thành tích nào.</p>
        ) : (
          <div className="space-y-4">
            {data.achievements.map(a => (
              <div key={a.id} className="flex gap-4 group relative">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0 border border-yellow-200">
                    <Award size={16} />
                  </div>
                  <div className="w-px h-full bg-slate-200 my-1 group-last:hidden"></div>
                </div>
                <div className="pb-4 w-full">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800">{a.title}</h4>
                    {isOwner && (
                      <button onClick={() => handleDelete('achievements', a.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {a.description && <p className="text-sm text-slate-600 mt-1">{a.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-3xl w-full max-w-lg p-6 animate-pop-in">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-xl text-slate-800">
                {activeModal === 'skill' && 'Thêm kỹ năng'}
                {activeModal === 'achievement' && 'Thêm thành tích'}
                {activeModal === 'certificate' && 'Thêm chứng chỉ'}
                {activeModal === 'project' && 'Thêm dự án'}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:bg-slate-100 rounded-full p-2 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Skill Form */}
            {activeModal === 'skill' && (
              <form onSubmit={handleAddSkill} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên kỹ năng *</label>
                  <input required autoFocus type="text" value={skillForm.skill} onChange={e => setSkillForm({...skillForm, skill: e.target.value})} className="glass-input w-full rounded-xl px-4 py-2" placeholder="VD: React.js, Python..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mức độ</label>
                  <select value={skillForm.level} onChange={e => setSkillForm({...skillForm, level: e.target.value})} className="glass-input w-full rounded-xl px-4 py-2">
                    <option value="beginner">Người mới bắt đầu</option>
                    <option value="intermediate">Trung bình</option>
                    <option value="advanced">Nâng cao</option>
                    <option value="expert">Chuyên gia</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors">Hủy</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                    {submitting ? 'Đang lưu...' : <><PlusCircle size={18}/> Lưu kỹ năng</>}
                  </button>
                </div>
              </form>
            )}

            {/* Achievement Form */}
            {activeModal === 'achievement' && (
              <form onSubmit={handleAddAchievement} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên thành tích / Giải thưởng *</label>
                  <input required autoFocus type="text" value={achievementForm.title} onChange={e => setAchievementForm({...achievementForm, title: e.target.value})} className="glass-input w-full rounded-xl px-4 py-2" placeholder="VD: Giải nhất Hackathon 2025" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả chi tiết</label>
                  <textarea rows={3} value={achievementForm.description} onChange={e => setAchievementForm({...achievementForm, description: e.target.value})} className="glass-input w-full rounded-xl px-4 py-2 resize-none" placeholder="Viết mô tả ngắn gọn..." />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors">Hủy</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2 bg-yellow-600 text-white rounded-xl font-bold hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                    {submitting ? 'Đang lưu...' : <><PlusCircle size={18}/> Lưu thành tích</>}
                  </button>
                </div>
              </form>
            )}

            {/* Certificate Form */}
            {activeModal === 'certificate' && (
              <form onSubmit={handleAddCert} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên chứng chỉ *</label>
                  <input required autoFocus type="text" value={certForm.name} onChange={e => setCertForm({...certForm, name: e.target.value})} className="glass-input w-full rounded-xl px-4 py-2" placeholder="VD: AWS Solutions Architect" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tổ chức cấp *</label>
                  <input required type="text" value={certForm.issuer} onChange={e => setCertForm({...certForm, issuer: e.target.value})} className="glass-input w-full rounded-xl px-4 py-2" placeholder="VD: Amazon Web Services" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ngày cấp</label>
                    <input type="date" value={certForm.issuedAt} onChange={e => setCertForm({...certForm, issuedAt: e.target.value})} className="glass-input w-full rounded-xl px-4 py-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Link xác nhận (Credential URL)</label>
                  <input type="url" value={certForm.credentialUrl} onChange={e => setCertForm({...certForm, credentialUrl: e.target.value})} className="glass-input w-full rounded-xl px-4 py-2" placeholder="https://..." />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors">Hủy</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                    {submitting ? 'Đang lưu...' : <><PlusCircle size={18}/> Lưu chứng chỉ</>}
                  </button>
                </div>
              </form>
            )}

            {/* Project Form */}
            {activeModal === 'project' && (
              <form onSubmit={handleAddProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên dự án *</label>
                  <input required autoFocus type="text" value={projectForm.title} onChange={e => setProjectForm({...projectForm, title: e.target.value})} className="glass-input w-full rounded-xl px-4 py-2" placeholder="VD: Hệ thống Quản lý Thư viện" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả dự án</label>
                  <textarea rows={2} value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} className="glass-input w-full rounded-xl px-4 py-2 resize-none" placeholder="Giới thiệu về dự án..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Công nghệ sử dụng (cách nhau bằng dấu phẩy)</label>
                  <input type="text" value={projectForm.techStack} onChange={e => setProjectForm({...projectForm, techStack: e.target.value})} className="glass-input w-full rounded-xl px-4 py-2" placeholder="VD: React, Node.js, MongoDB" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Link GitHub</label>
                    <input type="url" value={projectForm.githubUrl} onChange={e => setProjectForm({...projectForm, githubUrl: e.target.value})} className="glass-input w-full rounded-xl px-4 py-2" placeholder="https://github.com/..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Link Demo (Live)</label>
                    <input type="url" value={projectForm.demoUrl} onChange={e => setProjectForm({...projectForm, demoUrl: e.target.value})} className="glass-input w-full rounded-xl px-4 py-2" placeholder="https://..." />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors">Hủy</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                    {submitting ? 'Đang lưu...' : <><PlusCircle size={18}/> Lưu dự án</>}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
