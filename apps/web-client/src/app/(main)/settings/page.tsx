"use client";

import { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { apiFetch } from '../../lib/api';
import toast from 'react-hot-toast';

type TabId = 'account' | 'privacy' | 'notifications' | 'security';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'account', label: 'Tài khoản', icon: '👤' },
  { id: 'privacy', label: 'Quyền riêng tư', icon: '🔒' },
  { id: 'notifications', label: 'Thông báo', icon: '🔔' },
  { id: 'security', label: 'Bảo mật', icon: '🛡️' },
];

export default function SettingsPage() {
  const { user, isLoading, updateProfile } = useUser();
  const [activeTab, setActiveTab] = useState<TabId>('account');

  // Account form
  const [accountForm, setAccountForm] = useState({ fullName: '', bio: '', location: '' });
  const [savingAccount, setSavingAccount] = useState(false);

  // Privacy toggles — persisted to localStorage until backend supports them
  const [privacy, setPrivacy] = useState(() => {
    if (typeof window === 'undefined') return { profilePublic: true, showEmail: false, showStudentId: true, allowFriendRequests: true };
    try {
      const saved = localStorage.getItem('settings_privacy');
      return saved ? JSON.parse(saved) : { profilePublic: true, showEmail: false, showStudentId: true, allowFriendRequests: true };
    } catch { return { profilePublic: true, showEmail: false, showStudentId: true, allowFriendRequests: true }; }
  });

  // Notification toggles — persisted to localStorage
  const [notifications, setNotifications] = useState(() => {
    if (typeof window === 'undefined') return { likes: true, comments: true, friendRequests: true, messages: true, events: false };
    try {
      const saved = localStorage.getItem('settings_notifications');
      return saved ? JSON.parse(saved) : { likes: true, comments: true, friendRequests: true, messages: true, events: false };
    } catch { return { likes: true, comments: true, friendRequests: true, messages: true, events: false }; }
  });

  // Persist privacy to localStorage on change
  useEffect(() => {
    try { localStorage.setItem('settings_privacy', JSON.stringify(privacy)); } catch {}
  }, [privacy]);

  // Persist notifications to localStorage on change
  useEffect(() => {
    try { localStorage.setItem('settings_notifications', JSON.stringify(notifications)); } catch {}
  }, [notifications]);

  // Password change
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      const timeoutId = window.setTimeout(() => setAccountForm({
        fullName: user.fullName || '',
        bio: user.bio || '',
        location: user.location || '',
      }), 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [user]);

  const handleSaveAccount = async () => {
    setSavingAccount(true);
    try {
      await updateProfile({
        fullName: accountForm.fullName,
        bio: accountForm.bio,
        location: accountForm.location || null,
      });
      toast.success('Đã lưu thông tin tài khoản');
    } catch {
      toast.error('Lưu thất bại, vui lòng thử lại');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current || !passwordForm.next) {
      toast.error('Vui lòng nhập đầy đủ mật khẩu');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    if (passwordForm.next.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    setChangingPassword(true);
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.next,
        }),
      });
      if (res.ok) {
        toast.success('Đổi mật khẩu thành công');
        setPasswordForm({ current: '', next: '', confirm: '' });
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || 'Đổi mật khẩu thất bại');
      }
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setChangingPassword(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col mx-auto space-y-6 pb-20">
      {/* HEADER */}
      <div className="glass rounded-3xl border border-slate-200 p-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Cài đặt & Quyền riêng tư</h1>
        <p className="text-slate-500 text-[14px] mt-1">Quản lý tài khoản, quyền riêng tư và tùy chọn thông báo của bạn.</p>
      </div>

      <div className="flex gap-6">
        {/* TABS SIDEBAR */}
        <div className="w-1/3 shrink-0">
          <div className="glass rounded-3xl border border-slate-200 p-3 sticky top-24">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                    : 'text-slate-600 hover:bg-slate-100/80 border border-transparent'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1">
          <div className="glass rounded-3xl border border-slate-200 p-6">
            {activeTab === 'account' && (
              <div className="space-y-5">
                <h2 className="font-bold text-slate-800 text-lg">Thông tin tài khoản</h2>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Họ và tên</label>
                    <input
                      type="text"
                      value={accountForm.fullName}
                      onChange={e => setAccountForm({ ...accountForm, fullName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Mã sinh viên</label>
                    <input
                      type="text"
                      value={user.studentId || ''}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="text"
                    value={user.email || ''}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Tiểu sử</label>
                  <textarea
                    rows={3}
                    value={accountForm.bio}
                    onChange={e => setAccountForm({ ...accountForm, bio: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Đến từ</label>
                  <input
                    type="text"
                    value={accountForm.location}
                    onChange={e => setAccountForm({ ...accountForm, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveAccount}
                    disabled={savingAccount}
                    className="bg-indigo-600 px-8 py-2.5 rounded-full text-white font-bold hover:bg-indigo-700 shadow-md transition-all disabled:opacity-60"
                  >
                    {savingAccount ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-2">
                <h2 className="font-bold text-slate-800 text-lg mb-4">Quyền riêng tư</h2>
                <ToggleRow
                  label="Hồ sơ công khai"
                  desc="Cho phép mọi người trong trường xem trang cá nhân của bạn"
                  checked={privacy.profilePublic}
                  onChange={v => setPrivacy({ ...privacy, profilePublic: v })}
                />
                <ToggleRow
                  label="Hiển thị email"
                  desc="Email của bạn sẽ hiện trên trang cá nhân"
                  checked={privacy.showEmail}
                  onChange={v => setPrivacy({ ...privacy, showEmail: v })}
                />
                <ToggleRow
                  label="Hiển thị mã sinh viên"
                  desc="MSSV sẽ hiện công khai trên hồ sơ"
                  checked={privacy.showStudentId}
                  onChange={v => setPrivacy({ ...privacy, showStudentId: v })}
                />
                <ToggleRow
                  label="Cho phép lời mời kết bạn"
                  desc="Người khác có thể gửi lời mời kết bạn cho bạn"
                  checked={privacy.allowFriendRequests}
                  onChange={v => setPrivacy({ ...privacy, allowFriendRequests: v })}
                />
                <p className="text-xs text-slate-400 pt-3">Các tùy chọn quyền riêng tư được lưu trên trình duyệt. Sẽ đồng bộ khi backend hỗ trợ.</p>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-2">
                <h2 className="font-bold text-slate-800 text-lg mb-4">Tùy chọn thông báo</h2>
                <ToggleRow label="Lượt thích" desc="Khi ai đó thích bài viết của bạn" checked={notifications.likes} onChange={v => setNotifications({ ...notifications, likes: v })} />
                <ToggleRow label="Bình luận" desc="Khi ai đó bình luận bài viết của bạn" checked={notifications.comments} onChange={v => setNotifications({ ...notifications, comments: v })} />
                <ToggleRow label="Lời mời kết bạn" desc="Khi ai đó gửi lời mời kết bạn" checked={notifications.friendRequests} onChange={v => setNotifications({ ...notifications, friendRequests: v })} />
                <ToggleRow label="Tin nhắn" desc="Khi bạn nhận được tin nhắn mới" checked={notifications.messages} onChange={v => setNotifications({ ...notifications, messages: v })} />
                <ToggleRow label="Sự kiện" desc="Nhắc nhở về sự kiện sắp diễn ra" checked={notifications.events} onChange={v => setNotifications({ ...notifications, events: v })} />
                <p className="text-xs text-slate-400 pt-3">Các tùy chọn thông báo được lưu trên trình duyệt. Sẽ đồng bộ khi backend hỗ trợ.</p>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-5">
                <h2 className="font-bold text-slate-800 text-lg">Đổi mật khẩu</h2>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    value={passwordForm.current}
                    onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                  />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Mật khẩu mới</label>
                    <input
                      type="password"
                      value={passwordForm.next}
                      onChange={e => setPasswordForm({ ...passwordForm, next: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      value={passwordForm.confirm}
                      onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className="bg-indigo-600 px-8 py-2.5 rounded-full text-white font-bold hover:bg-indigo-700 shadow-md transition-all disabled:opacity-60"
                  >
                    {changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="pr-4">
        <p className="font-medium text-slate-800 text-[15px]">{label}</p>
        <p className="text-[13px] text-slate-500 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
        aria-pressed={checked}
        aria-label={label}
      >
        <span
          className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`}
        />
      </button>
    </div>
  );
}
