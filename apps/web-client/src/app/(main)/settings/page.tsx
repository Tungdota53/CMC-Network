'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { LogOut, User, Lock, Shield, Palette, Mail, Loader2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/useNotifications';
import { useUiStore } from '@/store/uiStore';

const notificationPreferenceItems = [
  { key: 'push', label: 'Thông báo PUSH', desc: 'Bật/tắt thông báo trong ứng dụng' },
  { key: 'email', label: 'Thông báo Email', desc: 'Gửi tóm tắt hoạt động qua email' },
  { key: 'likes', label: 'Lượt thích', desc: 'Báo khi có người thả cảm xúc bài viết' },
  { key: 'comments', label: 'Bình luận', desc: 'Báo khi có bình luận mới' },
  { key: 'mentions', label: 'Nhắc tên', desc: 'Báo khi có người nhắc đến bạn' },
  { key: 'friendRequests', label: 'Bạn bè', desc: 'Báo lời mời và chấp nhận kết bạn' },
  { key: 'system', label: 'Hệ thống', desc: 'Thông báo quan trọng từ CMC Network' },
  { key: 'quietHours', label: 'Chế độ yên lặng', desc: 'Tạm dừng thông báo thường, vẫn nhận hệ thống' },
] as const;

type NotificationPreferenceKey = (typeof notificationPreferenceItems)[number]['key'];

export default function SettingsPage() {
  const { logout, user } = useAuthStore();
  const router = useRouter();

  const { theme, setTheme } = useUiStore();
  const darkMode = theme === 'dark';
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [savingPreference, setSavingPreference] = useState<NotificationPreferenceKey | null>(null);
  const [preferenceMessage, setPreferenceMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { data: notif } = useNotificationPreferences();
  const updateNotif = useUpdateNotificationPreferences();

  const toggleDarkMode = () => {
    setTheme(darkMode ? 'light' : 'dark');
  };

  const passwordMutation = useMutation({
    mutationFn: async () => {
      return api.put(`/users/${user?.id}/password`, {
        currentPassword,
        newPassword,
      });
    },
    onSuccess: () => {
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Đổi mật khẩu thành công');
    },
    onError: (err: any) => {
      alert(err?.message || 'Đổi mật khẩu thất bại');
    },
  });

  const emailMutation = useMutation({
    mutationFn: async () => {
      return api.put(`/users/${user?.id}/email`, { email: newEmail });
    },
    onSuccess: () => {
      setShowEmailModal(false);
      setNewEmail('');
      alert('Cập nhật email thành công');
    },
    onError: (err: any) => {
      alert(err?.message || 'Cập nhật email thất bại');
    },
  });

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }
    if (newPassword.length < 6) {
      alert('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    passwordMutation.mutate();
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.includes('@')) {
      alert('Email không hợp lệ');
      return;
    }
    emailMutation.mutate();
  };

  const handleNotificationToggle = (key: NotificationPreferenceKey) => {
    if (!notif || updateNotif.isPending) return;

    setSavingPreference(key);
    setPreferenceMessage(null);
    updateNotif.mutate(
      { [key]: !notif[key] },
      {
        onSuccess: () => {
          setPreferenceMessage({ type: 'success', text: 'Đã lưu cài đặt thông báo.' });
        },
        onError: () => {
          setPreferenceMessage({ type: 'error', text: 'Không thể lưu cài đặt. Vui lòng thử lại.' });
        },
        onSettled: () => {
          setSavingPreference(null);
        },
      },
    );
  };

  return (
    <div className="max-w-3xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-foreground mb-2">Cài đặt & Quyền riêng tư</h1>
        <p className="text-foreground/60 text-[15px]">Quản lý tài khoản, tuỳ chỉnh giao diện và các thiết lập cá nhân của bạn.</p>
      </div>

      <div className="space-y-6">
        {/* Giao diện */}
        <section className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="p-5 border-b border-border">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Giao diện
            </h2>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[15px]">Chế độ Dark Mode</p>
                <p className="text-sm text-foreground/60">Chuyển đổi giữa giao diện sáng và tối</p>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${darkMode ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${darkMode ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Tài khoản */}
        <section className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="p-5 border-b border-border">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Thông tin tài khoản
            </h2>
          </div>
          <div className="p-0 divide-y divide-border">
            <button
              onClick={() => { setNewEmail(user?.email || ''); setShowEmailModal(true); }}
              className="w-full p-5 hover:bg-hover transition-colors flex items-center justify-between text-left"
            >
              <div>
                <p className="font-medium text-[15px]">Địa chỉ Email</p>
                <p className="text-sm text-foreground/60 mt-1">{user?.email || 'Đang tải...'}</p>
              </div>
              <span className="text-primary text-sm font-medium flex items-center gap-1">
                <Mail className="w-4 h-4" /> Chỉnh sửa
              </span>
            </button>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full p-5 hover:bg-hover transition-colors flex items-center justify-between text-left"
            >
              <div>
                <p className="font-medium text-[15px]">Mật khẩu</p>
                <p className="text-sm text-foreground/60 mt-1">Đổi mật khẩu định kỳ để bảo mật tài khoản</p>
              </div>
              <span className="text-primary text-sm font-medium flex items-center gap-1">
                <Lock className="w-4 h-4" /> Đổi mật khẩu
              </span>
            </button>
          </div>
        </section>

        {/* Thông báo */}
        <section className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="p-5 border-b border-border">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Thông báo & Quyền riêng tư
              </h2>
              {preferenceMessage && (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${preferenceMessage.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                  {preferenceMessage.text}
                </span>
              )}
            </div>
          </div>
          <div className="p-0 divide-y divide-border">
            {notificationPreferenceItems.map(item => {
              const value = notif?.[item.key] ?? false;
              const isSavingThis = savingPreference === item.key && updateNotif.isPending;

              return (
              <div key={item.key} className="p-5 flex items-center justify-between">
                <div>
                  <p className="font-medium text-[15px]">{item.label}</p>
                  <p className="text-sm text-foreground/60 mt-1">{item.desc}</p>
                </div>
                <button
                  onClick={() => handleNotificationToggle(item.key)}
                  disabled={!notif || updateNotif.isPending}
                  aria-pressed={value}
                  aria-label={`${value ? 'Tắt' : 'Bật'} ${item.label}`}
                  className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${value ? 'bg-primary' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white transition-transform ${value ? 'right-1' : 'left-1'}`}>
                    {isSavingThis && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                  </div>
                </button>
              </div>
            );
            })}
          </div>
        </section>

        {/* Danger Zone */}
        <section className="pt-6">
          <Button
            onClick={handleLogout}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold border border-red-500/20 h-14 rounded-2xl transition-all flex items-center justify-center gap-3 group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[16px]">Đăng xuất khỏi hệ thống</span>
          </Button>
        </section>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Đổi mật khẩu</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input type="password" placeholder="Mật khẩu hiện tại" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700" />
              <input type="password" placeholder="Mật khẩu mới" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700" />
              <input type="password" placeholder="Xác nhận mật khẩu mới" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700" />
              <button type="submit" disabled={passwordMutation.isPending} className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {passwordMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Xác nhận</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowEmailModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Cập nhật Email</h3>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <input type="email" placeholder="Email mới" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700" />
              <button type="submit" disabled={emailMutation.isPending} className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {emailMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Xác nhận</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
