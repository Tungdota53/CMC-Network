"use client";

import { useState, useRef, useEffect } from 'react';
import { parseStudentId, useUser } from '../../../contexts/UserContext';
import { apiFetch } from '../../../lib/api';
import Link from 'next/link';
import { VerifiedBadge } from '../../../components/VerifiedBadge';
import Portfolio from '../../../components/Portfolio';
import { Camera, Settings, Star, Award, GraduationCap, Monitor, MapPin, ThumbsUp, MessageSquare, Link as LinkIcon, Globe } from 'lucide-react';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);
  const { user, isLoading, updateProfile, uploadAvatar } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editForm, setEditForm] = useState({
    fullName: "",
    studentId: "",
    bio: "",
    location: ""
  });

  useEffect(() => {
    if (user) {
      const timeoutId = window.setTimeout(() => setEditForm({
        fullName: user.fullName || "",
        studentId: user.studentId || "",
        bio: user.bio || "",
        location: user.location || ""
      }), 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Gọi lên UserContext để upload avatar thật qua Backend API
      await uploadAvatar(file);
    }
  };

  const handleSaveProfile = async () => {
    await updateProfile({
      fullName: editForm.fullName,
      bio: editForm.bio,
      location: editForm.location || null,
    });
    setIsEditing(false);
  };

  const [friendCount, setFriendCount] = useState<number>(0);

  useEffect(() => {
    if (user?.id) {
      apiFetch(`/api/users/${user.id}/friends`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setFriendCount(data.length || 0))
        .catch(() => setFriendCount(0));
    }
  }, [user?.id]);

  if (isLoading || !user) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const parsedInfo = parseStudentId(user.studentId);

  return (
    <div className="w-full flex flex-col items-center mx-auto space-y-6 pb-20">
      
      {/* HEADER CARD */}
      <div className="w-full glass rounded-3xl overflow-hidden relative border border-slate-200">
        {/* Cover Photo */}
        <div className="h-64 w-full relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-80 z-0"></div>
          <img src="https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=1200&q=80" className="w-full h-full object-cover mix-blend-overlay z-10" />
          
          <button className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl text-slate-700 border border-slate-200 font-medium flex items-center gap-2 hover:bg-white transition-colors z-20 shadow-sm">
            <Camera size={16} /> Chỉnh sửa ảnh bìa
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-8 pb-8 relative">
          <div className="flex justify-between items-end -mt-16 mb-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl relative z-10 bg-slate-50">
                <img src={user.avatarUrl || "https://i.pravatar.cc/150?img=11"} className="w-full h-full object-cover" />
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 w-8 h-8 bg-slate-100 rounded-full border-2 border-white flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors z-20 shadow-sm"
                title="Thay đổi ảnh đại diện"
              >
                <Camera size={16} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            
            <div className="flex gap-3 mb-2">
              <button 
                onClick={() => setIsEditing(true)}
                className="bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 px-6 py-2.5 rounded-full text-white font-bold transition-colors"
              >
                Chỉnh sửa cá nhân
              </button>
              <button className="bg-white border border-slate-200 px-4 py-2.5 rounded-full text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"><Settings size={18} /></button>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-black text-slate-800 flex items-center tracking-tight">
              {user.fullName?.replace(' ✓', '')?.replace('✓', '')}
              {(user.role === 'ADMIN' || user.isVerified || user.fullName?.includes('✓')) && (
                <VerifiedBadge size={24} className="shrink-0 ml-1" />
              )}
            </h1>
            <p className="text-slate-500 font-medium mt-1 text-[15px]">
              {user.major} • {user.cohort} • {user.studentId}
            </p>
            <p className="text-slate-600 mt-4 leading-relaxed max-w-2xl text-[15px]">
              {user.bio}
            </p>
            <div className="flex gap-2 mt-4 flex-wrap">
              {user.reputationScore !== undefined && (
                 <span className="px-3 py-1 bg-yellow-50 text-yellow-600 font-bold rounded-full text-[13px] border border-yellow-200 flex items-center gap-1.5" title="Điểm uy tín trên hệ thống">
                    <Star size={14} className="fill-yellow-600" /> {user.reputationScore} Điểm
                 </span>
              )}
                {Array.isArray(user.badges) && user.badges.map((b, i: number) => {
                 const badge = typeof b === 'object' && b !== null ? b as { earnedAt?: string; badge?: { name?: string } | string } : null;
                 return (
                  <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-600 font-bold rounded-full text-[13px] border border-indigo-200 flex items-center gap-1.5" title={badge?.earnedAt ? `Nhận vào: ${new Date(badge.earnedAt).toLocaleDateString()}` : ''}>
                    <Award size={14} /> {typeof b === 'string' ? b : typeof badge?.badge === 'object' ? badge.badge.name || 'Huy hiệu' : badge?.badge || 'Huy hiệu'}
                 </span>
                 );
                })}
            </div>
            <div className="flex gap-6 mt-5 text-sm">
              <div className="cursor-pointer group"><span className="text-slate-800 font-bold group-hover:text-indigo-600 transition-colors">{friendCount}</span> <span className="text-slate-500 font-medium">Bạn bè</span></div>
              <div className="cursor-pointer group"><span className="text-slate-800 font-bold group-hover:text-indigo-600 transition-colors">0</span> <span className="text-slate-500 font-medium">Người theo dõi</span></div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-t border-slate-200 px-4 h-14">
          {[
            { id: 'posts', label: 'Bài viết' },
            { id: 'about', label: 'Giới thiệu' },
            { id: 'friends', label: 'Bạn bè' },
            { id: 'materials', label: 'Tài liệu' },
            { id: 'portfolio', label: 'Portfolio' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 h-full font-bold transition-colors relative ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-indigo-600 rounded-t-md shadow-sm"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="w-full flex gap-6">
        {/* Left Sidebar (Info) */}
        <div className="w-1/3 shrink-0 flex flex-col gap-6">
          <div className="glass rounded-3xl p-5 border border-slate-200">
            <h2 className="font-bold text-slate-800 text-lg mb-4">Giới thiệu</h2>
            <div className="space-y-4 text-[15px]">
              <div className="flex items-center gap-3 text-slate-600">
                <GraduationCap size={20} className="text-slate-500 shrink-0" />
                <span>Học tại <strong className="text-slate-800">Trường Đại học CMC</strong></span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Monitor size={20} className="text-slate-500 shrink-0" />
                <span>Chuyên ngành <strong className="text-slate-800">{user.major || 'Kỹ Thuật Phần Mềm'}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin size={20} className="text-slate-500 shrink-0" />
                <span>Đến từ <strong className="text-slate-800">{editForm.location}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Area */}
        <div className="flex-1">
          {activeTab === 'friends' ? (
            <FriendsTab userId={user.id} />
          ) : activeTab === 'portfolio' ? (
            <Portfolio userId={user.id} isOwner={true} />
          ) : (
            <>
              <div className="w-full glass border border-slate-200 rounded-3xl p-4 mb-6 flex items-center gap-4">
                <img src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.id}`} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-2.5 text-slate-500 text-[14px] cursor-pointer hover:bg-slate-100 transition-colors shadow-inner">
                  Bạn đang nghĩ gì thế?
                </div>
              </div>
              <UserPostsTab userId={user.id} />
            </>
          )}
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-3xl w-full max-w-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Chỉnh sửa thông tin cá nhân</h2>
              <button 
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Họ và tên</label>
                  <input type="text" value={editForm.fullName} onChange={(e) => setEditForm({...editForm, fullName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Mã sinh viên</label>
                  <input type="text" value={editForm.studentId} disabled className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Tiểu sử</label>
                <textarea rows={3} value={editForm.bio} onChange={(e) => setEditForm({...editForm, bio: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-inner"></textarea>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Khoa / Trường</label>
                  <input type="text" value={parsedInfo?.faculty || ''} disabled className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed" />
                  <p className="text-xs text-slate-500 mt-1">Tự động cập nhật theo Mã sinh viên</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Chuyên ngành</label>
                  <input type="text" value={parsedInfo?.major || ''} disabled className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Khóa</label>
                  <input type="text" value={parsedInfo?.cohort || ''} disabled className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Đến từ</label>
                  <input type="text" value={editForm.location} onChange={(e) => setEditForm({...editForm, location: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-200">
              <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-100 transition-colors">
                Hủy bỏ
              </button>
              <button 
                onClick={handleSaveProfile}
                className="bg-indigo-600 px-8 py-2.5 rounded-full text-white font-bold hover:bg-indigo-700 shadow-md transition-all"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type UserSummary = { id: string; fullName: string; avatarUrl?: string | null; major?: string | null; cohort?: string | null };
type FriendReq = { id: string; sender?: UserSummary; receiver?: UserSummary; createdAt: string };

function FriendsTab({ userId }: { userId: string }) {
  const [friends, setFriends] = useState<UserSummary[]>([]);
  const [incoming, setIncoming] = useState<FriendReq[]>([]);
  const [sent, setSent] = useState<FriendReq[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [fRes, iRes, sRes] = await Promise.all([
        apiFetch(`/api/users/${userId}/friends`),
        apiFetch(`/api/users/${userId}/friends/requests`),
        apiFetch(`/api/users/${userId}/friends/requests/sent`),
      ]);
      if (fRes.ok) setFriends(await fRes.json());
      if (iRes.ok) setIncoming(await iRes.json());
      if (sRes.ok) setSent(await sRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [userId]);

  const respond = async (reqId: string, status: 'accepted' | 'rejected') => {
    const res = await apiFetch(`/api/users/${userId}/friends/request/${reqId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  };

  const cancelReq = async (reqId: string) => {
    const res = await apiFetch(`/api/users/${userId}/friends/request/${reqId}`, { method: 'DELETE' });
    if (res.ok) load();
  };

  const removeFriend = async (friendId: string) => {
    const res = await apiFetch(`/api/users/${userId}/friends/${friendId}`, { method: 'DELETE' });
    if (res.ok) load();
  };

  const getAvatar = (u: UserSummary) => u.avatarUrl || `https://i.pravatar.cc/150?u=${u.id}`;

  if (loading) return <div className="glass border border-slate-200 rounded-3xl p-8 text-center text-slate-500">Đang tải...</div>;

  return (
    <div className="space-y-6">
      {incoming.length > 0 && (
        <div className="glass border border-slate-200 rounded-3xl p-5">
          <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
            Lời mời kết bạn
            <span className="text-xs bg-indigo-600 text-white rounded-full px-2 py-0.5">{incoming.length}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {incoming.map(req => req.sender && (
              <div key={req.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center gap-3">
                <img src={getAvatar(req.sender)} className="w-14 h-14 rounded-full" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-[15px] truncate">{req.sender.fullName}</p>
                  <p className="text-[12px] text-indigo-600 truncate">{req.sender.major || req.sender.cohort || 'Cùng trường'}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => respond(req.id, 'accepted')} className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg">Xác nhận</button>
                    <button onClick={() => respond(req.id, 'rejected')} className="flex-1 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg">Từ chối</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sent.length > 0 && (
        <div className="glass border border-slate-200 rounded-3xl p-5">
          <h3 className="font-bold text-slate-800 text-lg mb-4">Đã gửi lời mời</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sent.map(req => req.receiver && (
              <div key={req.id} className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={getAvatar(req.receiver)} className="w-10 h-10 rounded-full" />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 text-[14px] truncate">{req.receiver.fullName}</p>
                    <p className="text-[11px] text-slate-500">Đang chờ phản hồi</p>
                  </div>
                </div>
                <button onClick={() => cancelReq(req.id)} className="px-3 py-1 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs rounded-lg transition-colors">Hủy</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass border border-slate-200 rounded-3xl p-5">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Tất cả bạn bè ({friends.length})</h3>
        {friends.length === 0 ? (
          <p className="text-slate-500 text-center py-4">Bạn chưa có bạn bè nào.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {friends.map(friend => (
              <div key={friend.id} className="bg-slate-50 border border-slate-200 hover:border-slate-300 p-3 rounded-2xl flex items-center justify-between group transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={getAvatar(friend)} className="w-12 h-12 rounded-full" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-[15px] truncate group-hover:text-indigo-600 transition-colors">{friend.fullName}</p>
                    <p className="text-[12px] text-slate-500 truncate">{friend.major || friend.cohort || 'Cùng trường'}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFriend(friend.id)}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  Hủy kết bạn
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type ProfilePost = {
  id: string;
  userId: string;
  content?: string;
  createdAt: string;
  updatedAt?: string;
  mediaUrls?: string[];
  likes?: number;
  shareCount?: number;
  _count?: { comments?: number };
  sharedFrom?: {
    id?: string;
    content?: string | null;
    mediaUrls?: string[];
    user?: ProfilePost['user'];
  } | null;
  user?: {
    id?: string;
    fullName?: string;
    avatarUrl?: string | null;
    department?: string | null;
    role?: string;
    isVerified?: boolean;
  };
};

function UserPostsTab({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/posts/user/${userId}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setPosts(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const getAvatar = (u: ProfilePost['user'], fallbackId: string) => u?.avatarUrl || `https://i.pravatar.cc/150?u=${fallbackId}`;
  const getMediaUrl = (url: string) => url;

  if (loading) return <div className="glass border border-slate-200 rounded-3xl p-8 text-center text-slate-500">Đang tải bài viết...</div>;
  if (posts.length === 0) return <div className="glass border border-slate-200 rounded-3xl p-8 text-center text-slate-500">Chưa có bài viết nào.</div>;

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="w-full glass rounded-3xl overflow-hidden hover:border-slate-300 border border-slate-200 transition-colors">
          <div className="flex justify-between items-start p-5">
            <div className="flex items-center gap-3">
              <Link href={`/profile/${post.userId}`} className="relative group/avatar cursor-pointer">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 z-10 relative">
                  <img src={getAvatar(post.user, post.userId)} className="w-full h-full object-cover group-hover/avatar:scale-105 transition-transform" alt="" />
                </div>
              </Link>
              <div>
                <Link href={`/profile/${post.userId}`} className="font-semibold text-[15px] text-slate-800 hover:text-indigo-600 transition-colors leading-tight flex items-center">
                  {post.user?.fullName?.replace(' ✓', '')?.replace('✓', '') || 'Người dùng ẩn danh'}
                  {(post.user?.role === 'ADMIN' || post.user?.isVerified || post.user?.fullName?.includes('✓')) && (
                    <VerifiedBadge size={14} className="shrink-0 ml-0.5" />
                  )}
                </Link>
                <div className="text-[12px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <span className="font-medium hover:text-slate-700 cursor-pointer">{post.user?.department || 'Sinh viên'}</span>
                  <span>•</span>
                  <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                  <span>•</span>
                  <span className="opacity-70"><Globe size={12} /></span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 pb-4 text-slate-800 text-[14px] leading-relaxed">
            <p>{post.content} {post.updatedAt && post.updatedAt !== post.createdAt && <span className="text-[11px] text-slate-400 ml-1 font-normal italic">(Đã chỉnh sửa)</span>}</p>
          </div>

          {(post.mediaUrls || []).length > 0 && (
            <div className="px-5 pb-4 grid grid-cols-1 gap-2">
              {(post.mediaUrls || []).map((url: string) => (
                <img key={url} src={getMediaUrl(url)} className="w-full max-h-[520px] rounded-2xl object-cover border border-slate-200" alt="" />
              ))}
            </div>
          )}

          {post.sharedFrom && (
            <div className="px-5 pb-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
                <div className="flex items-center gap-2 p-3">
                  <img src={getAvatar(post.sharedFrom.user, post.sharedFrom.user?.id || post.sharedFrom.id || post.id)} className="w-8 h-8 rounded-full object-cover border border-slate-200" alt="" />
                  <span className="text-[13px] font-semibold text-slate-800">{post.sharedFrom.user?.fullName || 'Bài viết gốc'}</span>
                </div>
                {post.sharedFrom.content && <p className="px-3 pb-3 text-[13px] text-slate-600 leading-relaxed">{post.sharedFrom.content}</p>}
                {post.sharedFrom.mediaUrls?.[0] && (
                  <img src={getMediaUrl(post.sharedFrom.mediaUrls[0])} className="w-full max-h-[360px] object-cover" alt="" />
                )}
              </div>
            </div>
          )}

          <div className="px-5 py-3 flex justify-between items-center text-slate-500 border-b border-slate-200 text-[13px]">
            <div className="flex items-center gap-1.5 cursor-pointer group">
              <div className="flex -space-x-1.5">
                <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm relative z-10">
                  <ThumbsUp size={10} className="text-white fill-white" />
                </div>
              </div>
              <span className="font-medium group-hover:text-indigo-600 transition-colors ml-1">{post.likes || 0}</span>
            </div>
            <div className="flex gap-4">
              <span className="hover:text-slate-800 cursor-pointer transition-colors">{post._count?.comments || 0} bình luận</span>
              <span className="hover:text-slate-800 cursor-pointer transition-colors">{post.shareCount || 0} chia sẻ</span>
            </div>
          </div>

          <div className="px-3 py-2 flex justify-between items-center text-slate-500 font-medium text-[13px]">
            <button className="flex-1 flex items-center justify-center gap-2.5 hover:bg-indigo-50/60 py-2.5 rounded-2xl cursor-pointer transition-all duration-300 active:scale-95 group/btn text-slate-500 hover:text-indigo-600 font-medium">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm border bg-slate-50 border-slate-200/60 group-hover/btn:bg-white group-hover/btn:border-indigo-100 transition-all duration-300 group-hover/btn:-translate-y-0.5">
                <ThumbsUp size={16} className="text-slate-500 group-hover/btn:text-indigo-600 group-hover/btn:scale-110 transition-transform duration-300" />
              </div>
              <span>Thích</span>
            </button>

            <button className="flex-1 flex items-center justify-center gap-2.5 hover:bg-emerald-50/60 py-2.5 rounded-2xl cursor-pointer transition-all duration-300 active:scale-95 group/btn hover:text-emerald-600 text-slate-500 font-medium">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm border bg-slate-50 border-slate-200/60 group-hover/btn:bg-white group-hover/btn:border-emerald-100 transition-all duration-300 group-hover/btn:-translate-y-0.5">
                <MessageSquare size={16} className="text-slate-500 group-hover/btn:text-emerald-600 group-hover/btn:scale-110 transition-transform duration-300" />
              </div>
              <span>Bình luận</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2.5 hover:bg-purple-50/60 py-2.5 rounded-2xl cursor-pointer transition-all duration-300 active:scale-95 group/btn hover:text-purple-600 text-slate-500 font-medium">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm border bg-slate-50 border-slate-200/60 group-hover/btn:bg-white group-hover/btn:border-purple-100 transition-all duration-300 group-hover/btn:-translate-y-0.5">
                <LinkIcon size={16} className="text-slate-500 group-hover/btn:text-purple-600 group-hover/btn:scale-110 transition-transform duration-300" />
              </div>
              <span>Chia sẻ</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

