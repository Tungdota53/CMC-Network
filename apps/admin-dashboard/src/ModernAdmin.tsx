import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Activity, Bell, BookOpen, ChevronRight, CircleAlert, ClipboardList,
  Check, Download, FileText, LayoutDashboard, Lock, LogOut, Menu, MessageSquareText, MoreHorizontal,
  Package, RefreshCw, Search, ShieldCheck, Trash2, TrendingUp, Unlock, Users, X,
} from 'lucide-react';

type Section = 'dashboard' | 'users' | 'content' | 'reports' | 'audit';
type Analytics = {
  users: { total: number; dau: number; mau: number; newThisWeek: number; suspended: number };
  content: { posts: number; postsThisWeek: number; comments: number; materials: number; products: number };
  moderation: { pendingReports: number };
  generatedAt: string;
};
type GrowthPoint = { date: string; users: number; posts: number };
type AdminUser = { id: string; fullName?: string | null; email?: string | null; role?: string | null; status?: string | null; isSuspended?: boolean | null; createdAt?: string | null };
type Report = { id: string; targetType: string; targetId: string; reason: string; status: string; createdAt: string; reporter?: { fullName?: string | null; id: string } | null };
type AuditLog = { id: string; action: string; createdAt: string; actor?: { fullName?: string | null; id: string } | null };
type AdminPost = { id: string; content?: string | null; type?: string; visibility?: string; likes?: number; commentCount?: number; createdAt: string; user?: { id: string; fullName?: string | null; avatarUrl?: string | null } };
type PaginatedResponse<T> = { data: T[]; meta: { page: number; limit: number; total: number; totalPages: number } };
type PostAdminResponse = PaginatedResponse<AdminPost> | AdminPost[];
type Material = { id: string; title: string; subject?: string; fileType?: string; status?: string; downloadCount?: number; createdAt: string; uploader?: { fullName?: string | null } };
type Product = { id: string; title: string; price?: string | number; status?: string; category?: string; createdAt: string; seller?: { fullName?: string | null } };
type DashboardData = { analytics: Analytics; growth: GrowthPoint[]; users: AdminUser[]; reports: Report[]; auditLogs: AuditLog[]; posts: AdminPost[]; materials: Material[]; products: Product[] };
type LoginResponse = { access_token?: string; requires2FA?: boolean; user?: { role?: string | null }; message?: string };

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

const apiBase = (import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3001').replace(/\/$/, '');
const sections = {
  dashboard: { title: 'Tổng quan', subtitle: 'Theo dõi sức khỏe và hoạt động toàn hệ thống', eyebrow: 'TRUNG TÂM ĐIỀU HÀNH' },
  users: { title: 'Người dùng', subtitle: 'Quản lý tài khoản và trạng thái truy cập', eyebrow: 'QUẢN LÝ TÀI KHOẢN' },
  content: { title: 'Nội dung', subtitle: 'Giám sát bài viết, tài liệu và sản phẩm trên nền tảng', eyebrow: 'QUẢN TRỊ NỘI DUNG' },
  reports: { title: 'Báo cáo', subtitle: 'Kiểm duyệt các nội dung được cộng đồng báo cáo', eyebrow: 'TRUNG TÂM KIỂM DUYỆT' },
  audit: { title: 'Nhật ký', subtitle: 'Theo dõi hoạt động quản trị và sự kiện bảo mật', eyebrow: 'AN TOÀN HỆ THỐNG' },
} as const;
const navItems = [
  { id: 'dashboard' as const, icon: LayoutDashboard, label: 'Tổng quan', hint: 'Chỉ số hệ thống' },
  { id: 'users' as const, icon: Users, label: 'Người dùng', hint: 'Tài khoản & quyền' },
  { id: 'content' as const, icon: FileText, label: 'Nội dung', hint: 'Bài viết & tài nguyên' },
  { id: 'reports' as const, icon: CircleAlert, label: 'Báo cáo', hint: 'Kiểm duyệt nội dung' },
  { id: 'audit' as const, icon: ClipboardList, label: 'Nhật ký', hint: 'Hoạt động quản trị' },
];

async function getJson<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    const message = response.status === 401
      ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      : `${response.status} ${response.statusText}`;
    throw new ApiError(response.status, message);
  }
  return response.json() as Promise<T>;
}
async function sendJson<T>(path: string, token: string, method: 'PATCH' | 'PUT', body: unknown): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const payload = await response.json().catch(() => null) as T | { message?: string } | null;
  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null && 'message' in payload
      ? String(payload.message || 'Thao tác thất bại.')
      : `${response.status} ${response.statusText}`;
    throw new Error(message);
  }
  return payload as T;
}
async function loginAdmin(identifier: string, password: string) {
  const response = await fetch(`${apiBase}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier, password }) });
  const payload = await response.json().catch(() => ({})) as LoginResponse;
  if (!response.ok) throw new Error(payload.message || 'Không thể đăng nhập.');
  if (payload.requires2FA) throw new Error('Tài khoản đang bật 2FA. Hãy xác thực trên web-client trước.');
  if (!payload.access_token || payload.user?.role !== 'ADMIN') throw new Error('Tài khoản không có quyền quản trị.');
  localStorage.setItem('auth_token', payload.access_token);
  return payload.access_token;
}
const number = (value: number) => new Intl.NumberFormat('vi-VN').format(value);
const date = (value?: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';
const array = <T,>(value: T[] | undefined | null): T[] => Array.isArray(value) ? value : [];

function Brand() {
  return <div className="ma-brand"><span className="ma-brand-mark"><ShieldCheck size={21} /></span><span><strong>CMC Network</strong><small>Admin Console</small></span></div>;
}

export default function ModernAdmin() {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [section, setSection] = useState<Section>('dashboard');
  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState<string | null>(token ? null : 'Vui lòng đăng nhập để truy cập hệ thống quản trị.');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportAction, setReportAction] = useState<'REVIEWED' | 'RESOLVED' | 'DISMISSED'>('REVIEWED');
  const [note, setNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [growthDays, setGrowthDays] = useState(14);
  const [contentTab, setContentTab] = useState<'posts' | 'materials' | 'products'>('posts');
  const [selectedPost, setSelectedPost] = useState<AdminPost | null>(null);
  const [serviceWarnings, setServiceWarnings] = useState<string[]>([]);

  const load = async (accessToken: string) => {
    setLoading(true); setError(null); setServiceWarnings([]);
    try {
      // Validate the session first so an expired token produces one 401 instead of
      // firing every dashboard request with credentials that are already invalid.
      const analytics = await getJson<Analytics>('/admin/analytics', accessToken);
      const [growth, users, reports, auditLogs] = await Promise.all([
        getJson<GrowthPoint[]>('/admin/growth?days=14', accessToken),
        getJson<AdminUser[]>('/admin/users', accessToken), getJson<Report[]>('/admin/reports?status=ALL', accessToken),
        getJson<AuditLog[]>('/admin/audit-logs?limit=25', accessToken),
      ]);
      const contentResults = await Promise.allSettled([
        getJson<PostAdminResponse>('/posts/admin/all?page=1&limit=100', accessToken),
        getJson<Material[]>('/materials', accessToken), getJson<Product[]>('/marketplace', accessToken),
      ]);
      const labels = ['Bài viết', 'Tài liệu', 'Marketplace'];
      const warnings = contentResults.flatMap((result, index) => result.status === 'rejected' ? [`${labels[index]} tạm thời không khả dụng`] : []);
      const unauthorized = contentResults.find(result => result.status === 'rejected' && result.reason instanceof ApiError && result.reason.status === 401);
      if (unauthorized?.status === 'rejected') throw unauthorized.reason;
      const posts = contentResults[0].status === 'fulfilled'
        ? array(Array.isArray(contentResults[0].value) ? contentResults[0].value : contentResults[0].value?.data)
        : [];
      const materials = contentResults[1].status === 'fulfilled' ? array(contentResults[1].value) : [];
      const products = contentResults[2].status === 'fulfilled' ? array(contentResults[2].value) : [];
      setServiceWarnings(warnings);
      setData({ analytics, growth: array(growth), users: array(users), reports: array(reports), auditLogs: array(auditLogs), posts, materials, products });
    } finally { setLoading(false); }
  };
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      load(token).catch((err: Error) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          localStorage.removeItem('auth_token');
          setToken(null);
          setData(null);
        }
        setError(err.message);
      });
    });
    return () => { cancelled = true; };
  }, [token]);
  const login = async (event: FormEvent) => { event.preventDefault(); setLoginLoading(true); setError(null); try { const next = await loginAdmin(identifier, password); setPassword(''); setToken(next); } catch (err) { setError(err instanceof Error ? err.message : 'Đăng nhập thất bại.'); } finally { setLoginLoading(false); } };
  const logout = () => { localStorage.removeItem('auth_token'); setToken(null); setData(null); setError('Đã đăng xuất khỏi hệ thống quản trị.'); };
  const selectSection = (next: Section) => { setSection(next); setQuery(''); setRoleFilter('ALL'); setStatusFilter('ALL'); setPage(1); setMobileNav(false); };

  const users = useMemo(() => { const q = query.trim().toLowerCase(); return (data?.users ?? []).filter(u => (!q || [u.fullName, u.email, u.role, u.status].some(v => v?.toLowerCase().includes(q))) && (roleFilter === 'ALL' || u.role === roleFilter) && (statusFilter === 'ALL' || (statusFilter === 'BANNED' ? u.isSuspended : !u.isSuspended))); }, [data, query, roleFilter, statusFilter]);
  const reports = useMemo(() => { const q = query.trim().toLowerCase(); return (data?.reports ?? []).filter(r => (!q || [r.reason, r.status, r.targetType, r.reporter?.fullName].some(v => v?.toLowerCase().includes(q))) && (statusFilter === 'ALL' || r.status === statusFilter)); }, [data, query, statusFilter]);
  const logs = useMemo(() => { const q = query.trim().toLowerCase(); return (data?.auditLogs ?? []).filter(l => !q || [l.action, l.actor?.fullName].some(v => v?.toLowerCase().includes(q))); }, [data, query]);
  const updateUserStatus = async () => {
    if (!selectedUser || !token) return;
    setActionLoading(true);
    try {
      const suspended = !selectedUser.isSuspended;
      await sendJson(`/admin/users/${selectedUser.id}/status`, token, 'PATCH', { status: suspended ? 'BANNED' : 'ACTIVE' });
      setData(current => current ? { ...current, users: current.users.map(user => user.id === selectedUser.id ? { ...user, isSuspended: suspended, status: suspended ? 'BANNED' : 'ACTIVE' } : user) } : current);
      setToast(suspended ? 'Đã khóa tài khoản người dùng.' : 'Đã mở khóa tài khoản người dùng.'); setSelectedUser(null);
    } catch (err) { setToast(err instanceof Error ? err.message : 'Không thể cập nhật tài khoản.'); } finally { setActionLoading(false); }
  };
  const resolveReport = async () => {
    if (!selectedReport || !token) return;
    setActionLoading(true);
    try {
      await sendJson(`/admin/reports/${selectedReport.id}/resolve`, token, 'PUT', { status: reportAction, note: note.trim() || undefined });
      setData(current => current ? { ...current, reports: current.reports.map(report => report.id === selectedReport.id ? { ...report, status: reportAction } : report) } : current);
      setToast('Đã cập nhật báo cáo và ghi nhận vào nhật ký.'); setSelectedReport(null); setNote('');
    } catch (err) { setToast(err instanceof Error ? err.message : 'Không thể xử lý báo cáo.'); } finally { setActionLoading(false); }
  };
  const changeGrowthDays = async (days: number) => {
    if (!token) return;
    setGrowthDays(days);
    try { const growth = await getJson<GrowthPoint[]>(`/admin/growth?days=${days}`, token); setData(current => current ? { ...current, growth } : current); }
    catch (err) { setToast(err instanceof Error ? err.message : 'Không thể tải dữ liệu tăng trưởng.'); }
  };
  const deletePost = async () => {
    if (!selectedPost || !token) return;
    setActionLoading(true);
    try {
      const response = await fetch(`${apiBase}/posts/admin/${selectedPost.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      setData(current => current ? { ...current, posts: current.posts.filter(post => post.id !== selectedPost.id) } : current);
      setSelectedPost(null); setToast('Đã xóa vĩnh viễn bài viết.');
    } catch (err) { setToast(err instanceof Error ? err.message : 'Không thể xóa bài viết.'); } finally { setActionLoading(false); }
  };

  if (!token) return <div className="ma-login-page"><div className="ma-login-shell"><section className="ma-login-story"><Brand /><div><span className="ma-kicker">OPERATIONS CENTER</span><h1>Điều hành hệ thống<br />trong một không gian.</h1><p>Giám sát tăng trưởng, quản lý cộng đồng và xử lý rủi ro với dữ liệu cập nhật trực tiếp.</p></div><div className="ma-trust-row"><span><Activity /> Dữ liệu trực tiếp</span><span><ShieldCheck /> Phân quyền an toàn</span></div></section><form className="ma-login-card" onSubmit={login}><div className="ma-mobile-brand"><Brand /></div><span className="ma-kicker">ĐĂNG NHẬP QUẢN TRỊ</span><h2>Chào mừng trở lại</h2><p>Nhập thông tin tài khoản có quyền ADMIN.</p>{error && <div className="ma-alert" role="alert"><CircleAlert size={18} />{error}</div>}<label>Email hoặc mã sinh viên<input value={identifier} onChange={e => setIdentifier(e.target.value)} autoComplete="username" required placeholder="admin@cmc.edu.vn" /></label><label>Mật khẩu<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required placeholder="••••••••" /></label><button className="ma-primary" disabled={loginLoading}>{loginLoading ? <><RefreshCw className="ma-spin" /> Đang xác thực...</> : <>Tiếp tục <ChevronRight /></>}</button><small><ShieldCheck size={14} /> Chỉ tài khoản quản trị được cấp quyền mới có thể truy cập.</small></form></div></div>;

  const current = sections[section];
  return <div className="ma-app">
    {mobileNav && <button className="ma-backdrop" aria-label="Đóng menu" onClick={() => setMobileNav(false)} />}
    <aside className={`ma-sidebar ${mobileNav ? 'is-open' : ''}`}><div className="ma-sidebar-top"><Brand /><button className="ma-close" onClick={() => setMobileNav(false)} aria-label="Đóng menu"><X /></button></div><div className="ma-nav-label">KHÔNG GIAN LÀM VIỆC</div><nav aria-label="Điều hướng quản trị">{navItems.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => selectSection(item.id)} className={section === item.id ? 'active' : ''} aria-current={section === item.id ? 'page' : undefined}><Icon /><span><strong>{item.label}</strong><small>{item.hint}</small></span><ChevronRight /></button>; })}</nav><div className="ma-api-state"><span /><div><strong>Hệ thống trực tuyến</strong><small>Kết nối API Gateway</small></div></div><button className="ma-sidebar-logout" onClick={logout}><LogOut /> Đăng xuất</button></aside>
    <main className="ma-main"><header className="ma-header"><button className="ma-menu" onClick={() => setMobileNav(true)} aria-label="Mở menu"><Menu /></button><div className="ma-heading"><span>{current.eyebrow}</span><h1>{current.title}</h1><p>{current.subtitle}</p></div><div className="ma-header-actions">{section !== 'dashboard' && <label className="ma-search"><Search /><span className="sr-only">Tìm kiếm</span><input aria-label={`Tìm trong ${current.title}`} value={query} onChange={e => setQuery(e.target.value)} placeholder={`Tìm trong ${current.title.toLowerCase()}...`} /></label>}<button className="ma-icon-button" aria-label="Thông báo"><Bell /></button><button className="ma-icon-button" aria-label="Làm mới dữ liệu" disabled={loading} onClick={() => token && load(token).catch((err: Error) => setError(err.message))}><RefreshCw className={loading ? 'ma-spin' : ''} /></button><div className="ma-admin-avatar">A</div></div></header>
      {error && data && <div className="ma-inline-error" role="alert"><CircleAlert /> Không thể cập nhật dữ liệu: {error}</div>}
      {serviceWarnings.length > 0 && <div className="ma-inline-error" role="status"><CircleAlert /> {serviceWarnings.join(' · ')}. Dashboard vẫn tiếp tục hoạt động.</div>}
      {!data && error && <div className="ma-load-failure" role="alert"><CircleAlert /><strong>Không thể tải dữ liệu quản trị</strong><p>{error}</p><button onClick={() => load(token).catch((err: Error) => setError(err.message))}><RefreshCw /> Thử lại</button></div>}
      {loading && !data ? <div className="ma-skeleton-grid" aria-label="Đang tải dữ liệu"><i /><i /><i /><i /></div> : data && <div className="ma-content">
        {section === 'dashboard' && <section className="ma-command-banner"><div><span>ADMIN 2.0 · OPERATIONS CENTER</span><h2>Trung tâm vận hành hợp nhất</h2><p>Kiểm duyệt cộng đồng, quản trị tài khoản và giám sát nội dung theo thời gian thực.</p></div><div className="ma-command-actions"><button onClick={() => selectSection('reports')}><CircleAlert /><strong>{number(data.analytics.moderation.pendingReports)}</strong><span>Báo cáo chờ xử lý</span></button><button onClick={() => selectSection('content')}><FileText /><strong>{number(array(data.posts).length + array(data.materials).length + array(data.products).length)}</strong><span>Nội dung giám sát</span></button></div></section>}
        {section === 'dashboard' && <Dashboard data={data} days={growthDays} onDaysChange={changeGrowthDays} />}
        {section === 'users' && <><FilterBar><Filter value={roleFilter} onChange={value => { setRoleFilter(value); setPage(1); }} label="Vai trò" options={[['ALL','Tất cả vai trò'],['STUDENT','Sinh viên'],['TEACHER','Giảng viên'],['CLUB_LEADER','Chủ nhiệm CLB'],['ADMIN','Quản trị viên']]} /><Filter value={statusFilter} onChange={value => { setStatusFilter(value); setPage(1); }} label="Trạng thái" options={[['ALL','Tất cả trạng thái'],['ACTIVE','Đang hoạt động'],['BANNED','Đã khóa']]} /></FilterBar><UsersTable rows={users} page={page} setPage={setPage} onAction={setSelectedUser} /></>}
        {section === 'reports' && <><FilterBar><Filter value={statusFilter} onChange={value => { setStatusFilter(value); setPage(1); }} label="Trạng thái" options={[['ALL','Tất cả trạng thái'],['PENDING','Chờ xử lý'],['REVIEWED','Đã xem xét'],['RESOLVED','Đã giải quyết'],['DISMISSED','Đã bỏ qua']]} /></FilterBar><ReportsTable rows={reports} page={page} setPage={setPage} onAction={report => { setSelectedReport(report); setReportAction(report.status === 'PENDING' ? 'REVIEWED' : 'RESOLVED'); }} /></>}
        {section === 'content' && <ContentManager data={data} query={query} tab={contentTab} setTab={tab => { setContentTab(tab); setPage(1); }} page={page} setPage={setPage} onDeletePost={setSelectedPost} />}
        {section === 'audit' && <AuditTable rows={logs} />}
      </div>}
      {toast && <div className="ma-toast" role="status"><Check />{toast}<button onClick={() => setToast(null)} aria-label="Đóng thông báo"><X /></button></div>}
      {selectedUser && <Modal title={selectedUser.isSuspended ? 'Mở khóa tài khoản' : 'Khóa tài khoản'} onClose={() => setSelectedUser(null)}><div className="ma-dialog-user"><i>{(selectedUser.fullName || selectedUser.email || '?')[0]}</i><div><strong>{selectedUser.fullName || 'Chưa cập nhật'}</strong><span>{selectedUser.email}</span></div></div><p>{selectedUser.isSuspended ? 'Người dùng sẽ có thể đăng nhập và sử dụng lại hệ thống.' : 'Người dùng sẽ bị ngăn đăng nhập cho đến khi quản trị viên mở khóa.'}</p><div className="ma-dialog-actions"><button onClick={() => setSelectedUser(null)}>Hủy</button><button className={selectedUser.isSuspended ? 'primary' : 'danger'} onClick={updateUserStatus} disabled={actionLoading}>{actionLoading ? <RefreshCw className="ma-spin" /> : selectedUser.isSuspended ? <Unlock /> : <Lock />}{selectedUser.isSuspended ? 'Mở khóa' : 'Khóa tài khoản'}</button></div></Modal>}
      {selectedReport && <Modal title="Xử lý báo cáo" onClose={() => setSelectedReport(null)}><div className="ma-report-detail"><span>{selectedReport.targetType}</span><strong>{selectedReport.reason}</strong><small>Báo cáo bởi {selectedReport.reporter?.fullName || 'Người dùng ẩn danh'} · {date(selectedReport.createdAt)}</small></div><label className="ma-field">Quyết định<select value={reportAction} onChange={event => setReportAction(event.target.value as typeof reportAction)}><option value="REVIEWED">Đánh dấu đã xem xét</option><option value="RESOLVED">Đã giải quyết</option><option value="DISMISSED">Bỏ qua báo cáo</option></select></label><label className="ma-field">Ghi chú xử lý<textarea value={note} onChange={event => setNote(event.target.value)} maxLength={500} placeholder="Nhập lý do hoặc thông tin xử lý..." /><small>{note.length}/500</small></label><div className="ma-dialog-actions"><button onClick={() => setSelectedReport(null)}>Hủy</button><button className="primary" onClick={resolveReport} disabled={actionLoading}>{actionLoading ? <RefreshCw className="ma-spin" /> : <Check />}Xác nhận xử lý</button></div></Modal>}
      {selectedPost && <Modal title="Xóa bài viết" onClose={() => setSelectedPost(null)}><div className="ma-destructive-note"><Trash2 /><div><strong>Thao tác không thể hoàn tác</strong><p>Bài viết và các bình luận, lượt tương tác liên quan sẽ bị xóa vĩnh viễn.</p></div></div><div className="ma-report-detail"><span>{selectedPost.type || 'POST'}</span><strong>{selectedPost.content || 'Bài viết không có nội dung văn bản'}</strong><small>Tác giả: {selectedPost.user?.fullName || 'Không xác định'} · {date(selectedPost.createdAt)}</small></div><div className="ma-dialog-actions"><button onClick={() => setSelectedPost(null)}>Hủy</button><button className="danger" onClick={deletePost} disabled={actionLoading}>{actionLoading ? <RefreshCw className="ma-spin" /> : <Trash2 />}Xóa vĩnh viễn</button></div></Modal>}
    </main>
  </div>;
}

function Dashboard({ data, days, onDaysChange }: { data: DashboardData; days: number; onDaysChange: (days: number) => void }) {
  const stats = [
    { label: 'Tổng người dùng', value: data.analytics.users.total, meta: `+${data.analytics.users.newThisWeek} tuần này`, icon: Users, tone: 'blue' },
    { label: 'Hoạt động tháng', value: data.analytics.users.mau, meta: `${data.analytics.users.dau} hôm nay`, icon: Activity, tone: 'green' },
    { label: 'Tổng bài viết', value: data.analytics.content.posts, meta: `+${data.analytics.content.postsThisWeek} tuần này`, icon: FileText, tone: 'purple' },
    { label: 'Chờ kiểm duyệt', value: data.analytics.moderation.pendingReports, meta: `${data.analytics.users.suspended} tài khoản đình chỉ`, icon: CircleAlert, tone: 'orange' },
  ];
  const max = Math.max(1, ...data.growth.flatMap(p => [p.users, p.posts]));
  const exportCsv = () => { const rows = [['Ngày','Người dùng','Bài viết'], ...data.growth.map(p => [p.date,String(p.users),String(p.posts)])]; const blob = new Blob(['\uFEFF' + rows.map(row => row.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `cmc-growth-${days}-days.csv`; link.click(); URL.revokeObjectURL(url); };
  return <><section className="ma-welcome"><div><span>Hôm nay</span><h2>Tình hình hệ thống đang ổn định.</h2><p>Dữ liệu được tổng hợp từ các dịch vụ cốt lõi của CMC Network.</p></div><div className="ma-live"><i /> Cập nhật {date(data.analytics.generatedAt)}</div></section><div className="ma-metrics">{stats.map(s => { const Icon = s.icon; return <article className={`ma-metric ${s.tone}`} key={s.label}><div><span>{s.label}</span><strong>{number(s.value)}</strong><small><TrendingUp /> {s.meta}</small></div><i><Icon /></i></article>; })}</div><div className="ma-dashboard-grid"><section className="ma-card ma-chart-card"><div className="ma-card-head"><div><span>PHÂN TÍCH TĂNG TRƯỞNG</span><h2>Hoạt động {days} ngày gần nhất</h2></div><div className="ma-chart-actions"><select aria-label="Khoảng thời gian" value={days} onChange={event => onDaysChange(Number(event.target.value))}><option value="7">7 ngày</option><option value="14">14 ngày</option><option value="30">30 ngày</option></select><button onClick={exportCsv}><Download /> Xuất CSV</button></div></div><div className="ma-chart" role="img" aria-label={`Biểu đồ số người dùng và bài viết trong ${days} ngày`}>{data.growth.map(p => <div className="ma-bar-group" key={p.date}><div className="ma-bars"><i className="user" style={{ height: `${Math.max(5, p.users / max * 100)}%` }} /><i className="post" style={{ height: `${Math.max(5, p.posts / max * 100)}%` }} /></div><small>{p.date.slice(5)}</small></div>)}</div><div className="ma-legend"><span><i className="user" /> Người dùng</span><span><i className="post" /> Bài viết</span></div></section><section className="ma-card"><div className="ma-card-head"><div><span>KHO NỘI DUNG</span><h2>Tài nguyên hệ thống</h2></div><BookOpen /></div><div className="ma-resource-list"><Resource icon={MessageSquareText} label="Bình luận" value={data.analytics.content.comments} /><Resource icon={BookOpen} label="Tài liệu" value={data.analytics.content.materials} /><Resource icon={Package} label="Sản phẩm" value={data.analytics.content.products} /></div></section></div></>;
}
function Resource({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: number }) { return <div><i><Icon /></i><span>{label}<small>Dữ liệu đang hoạt động</small></span><strong>{number(value)}</strong></div>; }
function TableShell({ eyebrow, title, count, children, empty }: { eyebrow: string; title: string; count: number; children: React.ReactNode; empty: string }) { return <section className="ma-card ma-table-card"><div className="ma-table-title"><div><span>{eyebrow}</span><h2>{title}</h2></div><strong>{count} kết quả</strong></div>{count ? <div className="ma-table-scroll">{children}</div> : <div className="ma-empty"><Search /><strong>Không tìm thấy dữ liệu</strong><p>{empty}</p></div>}</section>; }
const PAGE_SIZE = 10;
function UsersTable({ rows, page, setPage, onAction }: { rows: AdminUser[]; page: number; setPage: (page: number) => void; onAction: (user: AdminUser) => void }) { const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE); return <TableShell eyebrow="DANH SÁCH TÀI KHOẢN" title="Người dùng hệ thống" count={rows.length} empty="Thử thay đổi từ khóa hoặc bộ lọc."><table><caption className="sr-only">Danh sách người dùng</caption><thead><tr><th>Người dùng</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Ngày tạo</th><th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{visible.map(u => <tr key={u.id}><td><div className="ma-user"><i>{(u.fullName || u.email || '?')[0].toUpperCase()}</i><strong>{u.fullName || 'Chưa cập nhật'}</strong></div></td><td>{u.email || '—'}</td><td><span className="ma-role">{u.role || '—'}</span></td><td><Status warning={Boolean(u.isSuspended)}>{u.isSuspended ? 'Đình chỉ' : 'Hoạt động'}</Status></td><td>{date(u.createdAt)}</td><td><button className="ma-row-action" onClick={() => onAction(u)} aria-label={`${u.isSuspended ? 'Mở khóa' : 'Khóa'} ${u.fullName || u.email}`} title={u.isSuspended ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}>{u.isSuspended ? <Unlock /> : <Lock />}</button></td></tr>)}</tbody></table><Pagination count={rows.length} page={page} setPage={setPage} /></TableShell>; }
function ReportsTable({ rows, page, setPage, onAction }: { rows: Report[]; page: number; setPage: (page: number) => void; onAction: (report: Report) => void }) { const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE); return <TableShell eyebrow="HÀNG ĐỢI KIỂM DUYỆT" title="Báo cáo nội dung" count={rows.length} empty="Không có báo cáo phù hợp với bộ lọc."><table><caption className="sr-only">Danh sách báo cáo</caption><thead><tr><th>Người báo cáo</th><th>Đối tượng</th><th>Lý do</th><th>Trạng thái</th><th>Thời gian</th><th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{visible.map(r => <tr key={r.id}><td>{r.reporter?.fullName || r.reporter?.id || 'Ẩn danh'}</td><td><span className="ma-target">{r.targetType}</span></td><td className="ma-reason">{r.reason}</td><td><Status warning={r.status === 'PENDING'}>{r.status === 'PENDING' ? 'Chờ xử lý' : r.status}</Status></td><td>{date(r.createdAt)}</td><td><button className="ma-row-action" onClick={() => onAction(r)} aria-label={`Xử lý báo cáo ${r.id}`}><MoreHorizontal /></button></td></tr>)}</tbody></table><Pagination count={rows.length} page={page} setPage={setPage} /></TableShell>; }
function AuditTable({ rows }: { rows: AuditLog[] }) { return <TableShell eyebrow="NHẬT KÝ BẢO MẬT" title="Hoạt động quản trị" count={rows.length} empty="Chưa có hoạt động quản trị nào được ghi nhận."><table><caption className="sr-only">Nhật ký quản trị</caption><thead><tr><th>Người thực hiện</th><th>Hành động</th><th>Thời gian</th></tr></thead><tbody>{rows.map(l => <tr key={l.id}><td><div className="ma-user"><i>{(l.actor?.fullName || 'S')[0]}</i><strong>{l.actor?.fullName || l.actor?.id || 'Hệ thống'}</strong></div></td><td>{l.action}</td><td>{date(l.createdAt)}</td></tr>)}</tbody></table></TableShell>; }
function ContentManager({ data, query, tab, setTab, page, setPage, onDeletePost }: { data: DashboardData; query: string; tab: 'posts' | 'materials' | 'products'; setTab: (tab: 'posts' | 'materials' | 'products') => void; page: number; setPage: (page: number) => void; onDeletePost: (post: AdminPost) => void }) {
  const q = query.trim().toLowerCase();
  const posts = array(data.posts).filter(item => !q || [item.content, item.type, item.user?.fullName].some(value => value?.toLowerCase().includes(q)));
  const materials = array(data.materials).filter(item => !q || [item.title, item.subject, item.fileType, item.uploader?.fullName].some(value => value?.toLowerCase().includes(q)));
  const products = array(data.products).filter(item => !q || [item.title, item.category, item.status, item.seller?.fullName].some(value => value?.toLowerCase().includes(q)));
  const count = tab === 'posts' ? posts.length : tab === 'materials' ? materials.length : products.length;
  const start = (page - 1) * PAGE_SIZE;
  return <><div className="ma-content-tabs" role="tablist" aria-label="Loại nội dung"><button role="tab" aria-selected={tab === 'posts'} className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')}><MessageSquareText /> Bài viết <span>{data.posts.length}</span></button><button role="tab" aria-selected={tab === 'materials'} className={tab === 'materials' ? 'active' : ''} onClick={() => setTab('materials')}><BookOpen /> Tài liệu <span>{data.materials.length}</span></button><button role="tab" aria-selected={tab === 'products'} className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}><Package /> Sản phẩm <span>{data.products.length}</span></button></div>{tab !== 'posts' && <div className="ma-monitor-note"><ShieldCheck /> Chế độ giám sát: backend hiện chưa hỗ trợ thao tác quản trị an toàn cho loại nội dung này.</div>}<TableShell eyebrow="KHO NỘI DUNG" title={tab === 'posts' ? 'Bài viết trên nền tảng' : tab === 'materials' ? 'Tài liệu học tập' : 'Sản phẩm marketplace'} count={count} empty="Không có nội dung phù hợp với tìm kiếm.">{tab === 'posts' && <table><caption className="sr-only">Danh sách bài viết</caption><thead><tr><th>Nội dung</th><th>Tác giả</th><th>Loại</th><th>Tương tác</th><th>Ngày đăng</th><th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{posts.slice(start, start + PAGE_SIZE).map(post => <tr key={post.id}><td className="ma-content-copy">{post.content || 'Không có nội dung văn bản'}</td><td>{post.user?.fullName || 'Không xác định'}</td><td><span className="ma-target">{post.type || 'POST'}</span></td><td>{number((post.likes || 0) + (post.commentCount || 0))}</td><td>{date(post.createdAt)}</td><td><button className="ma-row-action danger" onClick={() => onDeletePost(post)} aria-label={`Xóa bài viết của ${post.user?.fullName || 'người dùng'}`}><Trash2 /></button></td></tr>)}</tbody></table>}{tab === 'materials' && <table><caption className="sr-only">Danh sách tài liệu</caption><thead><tr><th>Tài liệu</th><th>Người tải lên</th><th>Môn học</th><th>Trạng thái</th><th>Lượt tải</th><th>Ngày tạo</th></tr></thead><tbody>{materials.slice(start, start + PAGE_SIZE).map(item => <tr key={item.id}><td><strong className="ma-item-title">{item.title}</strong></td><td>{item.uploader?.fullName || 'Không xác định'}</td><td>{item.subject || '—'}</td><td><Status warning={item.status !== 'READY'}>{item.status || 'READY'}</Status></td><td>{number(item.downloadCount || 0)}</td><td>{date(item.createdAt)}</td></tr>)}</tbody></table>}{tab === 'products' && <table><caption className="sr-only">Danh sách sản phẩm</caption><thead><tr><th>Sản phẩm</th><th>Người bán</th><th>Danh mục</th><th>Giá</th><th>Trạng thái</th><th>Ngày đăng</th></tr></thead><tbody>{products.slice(start, start + PAGE_SIZE).map(item => <tr key={item.id}><td><strong className="ma-item-title">{item.title}</strong></td><td>{item.seller?.fullName || 'Không xác định'}</td><td>{item.category || '—'}</td><td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(item.price || 0))}</td><td><Status warning={item.status === 'REMOVED'}>{item.status || 'AVAILABLE'}</Status></td><td>{date(item.createdAt)}</td></tr>)}</tbody></table>}<Pagination count={count} page={page} setPage={setPage} /></TableShell></>;
}
function Status({ warning, children }: { warning: boolean; children: React.ReactNode }) { return <span className={`ma-status ${warning ? 'warning' : 'ok'}`}><i />{children}</span>; }
function FilterBar({ children }: { children: React.ReactNode }) { return <div className="ma-filter-bar">{children}</div>; }
function Filter({ value, onChange, label, options }: { value: string; onChange: (value: string) => void; label: string; options: string[][] }) { return <label><span>{label}</span><select value={value} onChange={event => onChange(event.target.value)}>{options.map(([key, text]) => <option value={key} key={key}>{text}</option>)}</select></label>; }
function Pagination({ count, page, setPage }: { count: number; page: number; setPage: (page: number) => void }) { const total = Math.max(1, Math.ceil(count / PAGE_SIZE)); if (total === 1) return null; return <div className="ma-pagination"><span>Trang {page} / {total}</span><div><button disabled={page === 1} onClick={() => setPage(page - 1)}>Trước</button><button disabled={page === total} onClick={() => setPage(page + 1)}>Sau</button></div></div>; }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="ma-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section className="ma-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header><h2 id="modal-title">{title}</h2><button onClick={onClose} aria-label="Đóng"><X /></button></header>{children}</section></div>; }
