import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';

type AdminSection = 'Dashboard' | 'Users' | 'Reports' | 'Audit Logs';

type Analytics = {
  users: {
    total: number;
    dau: number;
    mau: number;
    newThisWeek: number;
    suspended: number;
  };
  content: {
    posts: number;
    postsThisWeek: number;
    comments: number;
    materials: number;
    products: number;
  };
  moderation: { pendingReports: number };
  generatedAt: string;
};

type GrowthPoint = { date: string; users: number; posts: number };

type AdminUser = {
  id: string;
  fullName?: string | null;
  email?: string | null;
  role?: string | null;
  status?: string | null;
  isSuspended?: boolean | null;
  createdAt?: string | null;
};

type Report = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter?: { fullName?: string | null; id: string } | null;
};

type AuditLog = {
  id: string;
  action: string;
  createdAt: string;
  actor?: { fullName?: string | null; id: string } | null;
};

type DashboardData = {
  analytics: Analytics;
  growth: GrowthPoint[];
  users: AdminUser[];
  reports: Report[];
  auditLogs: AuditLog[];
};

type LoginResponse = {
  access_token?: string;
  requires2FA?: boolean;
  user?: { role?: string | null };
};

const apiBase = (import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3001').replace(/\/$/, '');

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard' as const, description: 'Tổng quan hệ thống' },
  { icon: Users, label: 'Users' as const, description: 'Tài khoản người dùng' },
  { icon: CircleAlert, label: 'Reports' as const, description: 'Kiểm duyệt báo cáo' },
  { icon: ClipboardList, label: 'Audit Logs' as const, description: 'Lịch sử vận hành' },
];

const CMCLogo = () => (
  <div className="cmc-logo-icon" aria-hidden="true">
    <svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 40 C 5 40, 5 20, 25 20 C 30 5, 55 5, 65 15 C 75 5, 95 10, 95 30 C 100 30, 100 40, 85 40 Z" />
      <path d="M 28 40 L 40 20 L 50 40 L 60 20 L 72 40" />
      <circle cx="20" cy="40" r="3" fill="#0ea5e9" stroke="none" />
      <circle cx="25" cy="20" r="3" fill="#0ea5e9" stroke="none" />
      <circle cx="65" cy="15" r="3" fill="#0ea5e9" stroke="none" />
      <circle cx="95" cy="30" r="3" fill="#0ea5e9" stroke="none" />
      <circle cx="85" cy="40" r="3" fill="#0ea5e9" stroke="none" />
      <circle cx="28" cy="40" r="3" fill="#0ea5e9" stroke="none" />
      <circle cx="40" cy="20" r="3" fill="#0ea5e9" stroke="none" />
      <circle cx="50" cy="40" r="3" fill="#0ea5e9" stroke="none" />
      <circle cx="60" cy="20" r="3" fill="#0ea5e9" stroke="none" />
      <circle cx="72" cy="40" r="3" fill="#0ea5e9" stroke="none" />
    </svg>
  </div>
);

async function getJson<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText}${text ? `: ${text}` : ''}`);
  }

  return response.json() as Promise<T>;
}

async function loginAdmin(identifier: string, password: string): Promise<string> {
  const response = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const payload = (await response.json().catch(() => ({}))) as LoginResponse & { message?: string };
  if (!response.ok) throw new Error(payload.message || `${response.status} ${response.statusText}`);
  if (payload.requires2FA) throw new Error('Tài khoản bật 2FA. Đăng nhập web-client lấy token rồi mở admin.');
  if (!payload.access_token) throw new Error('Login không trả access_token.');
  if (payload.user?.role !== 'ADMIN') throw new Error('Tài khoản không có quyền ADMIN.');
  localStorage.setItem('auth_token', payload.access_token);
  return payload.access_token;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function metricCards(data: Analytics) {
  return [
    { title: 'Tổng người dùng', value: data.users.total, meta: `+${data.users.newThisWeek} trong tuần này`, icon: Users, tone: 'blue' },
    { title: 'Hoạt động tháng', value: data.users.mau, meta: `${data.users.dau} hoạt động hôm nay`, icon: Activity, tone: 'green' },
    { title: 'Bài viết', value: data.content.posts, meta: `+${data.content.postsThisWeek} trong tuần này`, icon: FileText, tone: 'violet' },
    { title: 'Báo cáo chờ xử lý', value: data.moderation.pendingReports, meta: `${data.users.suspended} tài khoản bị đình chỉ`, icon: CircleAlert, tone: 'amber' },
  ];
}

export default function App() {
  const [initialToken] = useState(() => localStorage.getItem('auth_token'));
  const [activeNav, setActiveNav] = useState<AdminSection>('Dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(Boolean(initialToken));
  const [error, setError] = useState<string | null>(
    initialToken ? null : 'Cần đăng nhập ADMIN để gọi API thật.',
  );
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const loadDashboard = (token: string) => {
    setLoading(true);
    setError(null);

    return Promise.all([
      getJson<Analytics>('/admin/analytics', token),
      getJson<GrowthPoint[]>('/admin/growth?days=14', token),
      getJson<AdminUser[]>('/admin/users', token),
      getJson<Report[]>('/admin/reports?status=ALL', token),
      getJson<AuditLog[]>('/admin/audit-logs?limit=25', token),
    ])
      .then(([analytics, growth, users, reports, auditLogs]) => {
        setData({ analytics, growth, users, reports, auditLogs });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!initialToken) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      loadDashboard(initialToken)
        .catch((err: Error) => {
          if (!cancelled) {
            localStorage.removeItem('auth_token');
            setError(err.message);
          }
        });
    });

    return () => {
      cancelled = true;
    };
  }, [initialToken]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginLoading(true);
    setError(null);
    try {
      const token = await loginAdmin(identifier, password);
      setPassword('');
      await loadDashboard(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
      setLoading(false);
    } finally {
      setLoginLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!data || !q) return data?.users ?? [];
    return data.users.filter((user) =>
      [user.fullName, user.email, user.role, user.status].some((value) => value?.toLowerCase().includes(q)),
    );
  }, [data, searchTerm]);

  const filteredReports = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!data || !q) return data?.reports ?? [];
    return data.reports.filter((report) =>
      [report.reason, report.status, report.targetType, report.reporter?.fullName].some((value) =>
        value?.toLowerCase().includes(q),
      ),
    );
  }, [data, searchTerm]);

  const maxGrowth = Math.max(1, ...(data?.growth ?? []).flatMap((point) => [point.users, point.posts]));
  const logout = () => {
    localStorage.removeItem('auth_token');
    setData(null);
    setError('Đã đăng xuất. Đăng nhập lại để tiếp tục quản trị.');
  };

  const refreshDashboard = () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    loadDashboard(token).catch((err: Error) => setError(err.message));
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <CMCLogo />
          <div><div className="brand-text">CMC <span>ADMIN</span></div><div className="brand-caption">Operations Center</div></div>
        </div>

        <div className="workspace-label">KHÔNG GIAN QUẢN TRỊ</div>

        <nav className="nav-menu" aria-label="Admin sections">
          {navItems.map((item) => (
            (() => { const Icon = item.icon; return (
            <button
              key={item.label}
              onClick={() => setActiveNav(item.label)}
              className={`nav-item ${activeNav === item.label ? 'active' : ''}`}
            >
              <Icon size={19} aria-hidden="true" />
              <span className="nav-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
              <ChevronRight className="nav-chevron" size={15} aria-hidden="true" />
            </button>
            ); })()
          ))}
        </nav>
        <div className="sidebar-footer"><ShieldCheck size={18} /><span><strong>Kết nối bảo mật</strong><small>API Gateway đang hoạt động</small></span></div>
      </aside>

      <main className="main-content">
        <header className="header">
          <div>
            <h1 className="page-title">{activeNav}</h1>
            <p className="page-subtitle">Trung tâm điều hành và kiểm duyệt CMC Network</p>
          </div>
          <div className="header-actions">
          {data && <div className="search-bar">
            <Search size={18} aria-hidden="true" />
            <input
              type="text"
              placeholder="Tìm user, report..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>}
          {data && <button className="icon-button" onClick={refreshDashboard} disabled={loading} title="Làm mới dữ liệu" aria-label="Làm mới dữ liệu"><RefreshCw size={18} className={loading ? 'spin' : ''} /></button>}
          {data && <button className="logout-button" onClick={logout}><LogOut size={17} />Đăng xuất</button>}
          </div>
        </header>

        {loading && <div className="loading-grid" aria-label="Đang tải"><div /><div /><div /><div /></div>}
        {error && !data && (
          <div className="login-layout"><section className="login-intro"><div className="login-mark"><ShieldCheck size={26} /></div><p className="eyebrow">CMC NETWORK</p><h2>Trung tâm vận hành<br />hệ thống</h2><p>Quản lý người dùng, kiểm duyệt nội dung và theo dõi hoạt động trên một giao diện bảo mật.</p><ul><li><Activity size={16} /> Dữ liệu vận hành theo thời gian thực</li><li><ShieldCheck size={16} /> Phân quyền quản trị nghiêm ngặt</li><li><ClipboardList size={16} /> Mọi thao tác đều được ghi nhận</li></ul></section>
          <form className="login-panel" onSubmit={handleLogin}>
            <div className="login-heading"><span>ĐĂNG NHẬP BẢO MẬT</span><h2>Chào mừng trở lại</h2><p>Sử dụng tài khoản có quyền ADMIN để tiếp tục.</p></div>
            <div className="login-alert" role="alert"><CircleAlert size={17} />{error}</div>
            <label>
              Email hoặc MSSV
              <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" required />
            </label>
            <label>
              Mật khẩu
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
            </label>
            <button className="primary-button" type="submit" disabled={loginLoading}>{loginLoading ? <><RefreshCw className="spin" size={18} />Đang xác thực...</> : <>Đăng nhập quản trị<ChevronRight size={18} /></>}</button>
            <p className="login-note"><ShieldCheck size={14} /> Phiên đăng nhập được bảo vệ bằng access token.</p>
          </form></div>
        )}

        {!loading && !error && data && (
          <>
            <div className="metrics-grid">
              {metricCards(data.analytics).map((stat) => (
                <div key={stat.title} className={`metric-card metric-${stat.tone}`}>
                  <div className="metric-header">
                    <span>{stat.title}</span>
                    <span className="metric-icon"><stat.icon size={20} /></span>
                  </div>
                  <div className="metric-value">{formatNumber(stat.value)}</div>
                  <div className="metric-change positive">{stat.meta}</div>
                </div>
              ))}
            </div>

            {activeNav === 'Dashboard' && (
              <div className="dashboard-grid">
                <section className="panel panel-stack">
                  <div className="panel-heading"><div><span>PHÂN TÍCH TĂNG TRƯỞNG</span><h3>Hoạt động 14 ngày gần nhất</h3></div><BarChart3 size={20} /></div>
                  <div className="real-chart" aria-label="Growth chart">
                    {data.growth.map((point) => (
                      <div className="bar-group" key={point.date} title={`${point.date}: ${point.users} users, ${point.posts} posts`}>
                        <div className="bar users" style={{ height: `${Math.max(4, (point.users / maxGrowth) * 100)}%` }} />
                        <div className="bar posts" style={{ height: `${Math.max(4, (point.posts / maxGrowth) * 100)}%` }} />
                        <span>{point.date.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="legend"><span className="dot users" /> Users <span className="dot posts" /> Posts</div>
                </section>

                <section className="panel panel-stack">
                  <div className="panel-heading"><div><span>TỔNG QUAN NỘI DUNG</span><h3>Kho dữ liệu hệ thống</h3></div><BookOpen size={20} /></div>
                  <div className="summary-list">
                    <div><span><MessageSquareText size={17} /> Bình luận</span><strong>{formatNumber(data.analytics.content.comments)}</strong></div>
                    <div><span><BookOpen size={17} /> Tài liệu</span><strong>{formatNumber(data.analytics.content.materials)}</strong></div>
                    <div><span><Package size={17} /> Sản phẩm</span><strong>{formatNumber(data.analytics.content.products)}</strong></div>
                    <div><span><RefreshCw size={17} /> Cập nhật lúc</span><strong>{formatDate(data.analytics.generatedAt)}</strong></div>
                  </div>
                </section>
              </div>
            )}

            {activeNav === 'Users' && (
              <section className="panel panel-stack">
                <div className="table-heading"><div><span>NGƯỜI DÙNG HỆ THỐNG</span><h3>Danh sách tài khoản</h3></div><strong>{filteredUsers.length} kết quả</strong></div>
                <div className="table-scroll">
                <table className="data-table">
                  <thead><tr><th>Người dùng</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td><div className="user-cell"><span>{(user.fullName || user.email || '?').charAt(0).toUpperCase()}</span><strong>{user.fullName || 'Chưa cập nhật'}</strong></div></td>
                        <td>{user.email || '—'}</td>
                        <td><span className="role-badge">{user.role || '—'}</span></td>
                        <td><span className={`status-badge ${user.isSuspended ? 'status-offline' : 'status-active'}`}>{user.isSuspended ? 'SUSPENDED' : user.status || 'ACTIVE'}</span></td>
                        <td>{formatDate(user.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && <div className="empty-state"><Search size={24} /><strong>Không tìm thấy người dùng</strong><span>Thử thay đổi từ khóa tìm kiếm.</span></div>}
                </div>
              </section>
            )}

            {activeNav === 'Reports' && (
              <section className="panel panel-stack">
                <div className="table-heading"><div><span>TRUNG TÂM KIỂM DUYỆT</span><h3>Báo cáo nội dung</h3></div><strong>{filteredReports.length} kết quả</strong></div>
                <div className="table-scroll">
                <table className="data-table">
                  <thead><tr><th>Người báo cáo</th><th>Đối tượng</th><th>Lý do</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead>
                  <tbody>
                    {filteredReports.map((report) => (
                      <tr key={report.id}>
                        <td>{report.reporter?.fullName || report.reporter?.id || '—'}</td>
                        <td>{report.targetType}: {report.targetId}</td>
                        <td>{report.reason}</td>
                        <td><span className={`status-badge ${report.status === 'PENDING' ? 'status-warning' : 'status-active'}`}>{report.status}</span></td>
                        <td>{formatDate(report.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredReports.length === 0 && <div className="empty-state"><ShieldCheck size={24} /><strong>Không có báo cáo phù hợp</strong><span>Hệ thống hiện không có dữ liệu theo bộ lọc này.</span></div>}
                </div>
              </section>
            )}

            {activeNav === 'Audit Logs' && (
              <section className="panel panel-stack">
                <div className="table-heading"><div><span>NHẬT KÝ BẢO MẬT</span><h3>Hoạt động quản trị</h3></div><strong>{data.auditLogs.length} bản ghi</strong></div>
                <div className="table-scroll">
                <table className="data-table">
                  <thead><tr><th>Người thực hiện</th><th>Hành động</th><th>Thời gian</th></tr></thead>
                  <tbody>
                    {data.auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{log.actor?.fullName || log.actor?.id || 'System'}</td>
                        <td>{log.action}</td>
                        <td>{formatDate(log.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.auditLogs.length === 0 && <div className="empty-state"><ClipboardList size={24} /><strong>Chưa có nhật ký</strong><span>Hoạt động quản trị sẽ xuất hiện tại đây.</span></div>}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
