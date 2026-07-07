"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import Link from 'next/link';
import { useUser, parseStudentId } from '../../../contexts/UserContext';
import { VerifiedBadge } from '../../../components/VerifiedBadge';
import Portfolio from '../../../components/Portfolio';
import { UserPlus, CornerUpLeft, Check, UserCheck, MessageSquare, Star, GraduationCap, Monitor, MapPin, Globe, ThumbsUp } from 'lucide-react';

type PublicUser = {
  id: string;
  fullName?: string | null;
  coverPhotoUrl?: string | null;
  avatarUrl?: string | null;
  studentId?: string | null;
  department?: string | null;
  cohort?: string | null;
  bio?: string | null;
  role?: string | null;
  isVerified?: boolean;
  reputationScore?: number;
  location?: string | null;
};

type FriendUser = { id: string };
type FriendRequest = { id: string; sender?: FriendUser; receiver?: FriendUser };

type ProfilePost = {
  id: string;
  userId: string;
  user?: PublicUser;
  content?: string;
  createdAt: string;
  updatedAt?: string;
  mediaUrls?: string[];
  likes?: number;
  shareCount?: number;
  _count?: { comments?: number };
};

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('posts');
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [friendCount, setFriendCount] = useState(0);

  const { user: currentUser } = useUser();
  const [friendStatus, setFriendStatus] = useState<'none' | 'friends' | 'sent' | 'received'>('none');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchFriendStatus = useCallback(async () => {
    if (!currentUser?.id || !params?.id) return;
    try {
      // Check if friends
      const fRes = await apiFetch(`/api/users/${currentUser.id}/friends`);
      if (fRes.ok) {
        const friends: FriendUser[] = await fRes.json();
        if (friends.some((f) => f.id === params.id)) {
          setFriendStatus('friends');
          return;
        }
      }

      // Check if sent
      const sRes = await apiFetch(`/api/users/${currentUser.id}/friends/requests/sent`);
      if (sRes.ok) {
        const sent: FriendRequest[] = await sRes.json();
        const req = sent.find((r) => r.receiver?.id === params.id);
        if (req) {
          setFriendStatus('sent');
          setRequestId(req.id);
          return;
        }
      }

      // Check if received
      const rRes = await apiFetch(`/api/users/${currentUser.id}/friends/requests`);
      if (rRes.ok) {
        const received: FriendRequest[] = await rRes.json();
        const req = received.find((r) => r.sender?.id === params.id);
        if (req) {
          setFriendStatus('received');
          setRequestId(req.id);
          return;
        }
      }

      setFriendStatus('none');
    } catch (e) {
      console.error(e);
    }
  }, [currentUser, params]);

  const handleMessage = async () => {
    if (!currentUser || !params?.id) return;
    try {
      const res = await apiFetch('/api/chat/conversations/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user1Id: currentUser.id, user2Id: params.id }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/chat?conversationId=${data.id}`);
      }
    } catch (err) {
      console.error('Failed to create/get conversation:', err);
    }
  };

  useEffect(() => {
    if (!params?.id) return;
    
    // Fetch User Profile
    apiFetch(`/api/users/${params.id}/profile`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));

    // Fetch Friend Count
    apiFetch(`/api/users/${params.id}/friends`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setFriendCount(data.length || 0))
      .catch(() => setFriendCount(0));
  }, [params?.id]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void fetchFriendStatus(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchFriendStatus]);

  if (isLoading || !user) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const parsedInfo = parseStudentId(user.studentId || '');

  return (
    <div className="w-full flex flex-col items-center mx-auto space-y-6 pb-20">
      {/* HEADER CARD */}
      <div className="w-full glass rounded-3xl overflow-hidden relative border border-slate-200">
        <div className="h-64 w-full relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-80 z-0"></div>
          <img src={user.coverPhotoUrl || "https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=1200&q=80"} className="w-full h-full object-cover mix-blend-overlay z-10" />
        </div>

        <div className="px-8 pb-8 relative">
          <div className="flex justify-between items-end -mt-16 mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl relative z-10 bg-slate-50">
              <img src={user.avatarUrl || "https://i.pravatar.cc/150?img=11"} className="w-full h-full object-cover" />
            </div>
            
            <div className="flex gap-3 mb-2">
              {currentUser && currentUser.id !== params.id && (
                <>
                  {friendStatus === 'none' && (
                    <button onClick={async () => {
                      setIsProcessing(true);
                      const res = await apiFetch(`/api/users/${currentUser.id}/friends/request`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ receiverId: params.id })
                      });
                      if (res.ok) await fetchFriendStatus();
                      setIsProcessing(false);
                    }} disabled={isProcessing} className="bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 px-6 py-2.5 rounded-full text-white font-bold transition-colors flex items-center gap-2 disabled:opacity-50">
                      <UserPlus size={18} /> Kết bạn
                    </button>
                  )}
                  {friendStatus === 'sent' && (
                    <button onClick={async () => {
                      if (!requestId) return;
                      setIsProcessing(true);
                      const res = await apiFetch(`/api/users/${currentUser.id}/friends/request/${requestId}`, { method: 'DELETE' });
                      if (res.ok) await fetchFriendStatus();
                      setIsProcessing(false);
                    }} disabled={isProcessing} className="bg-slate-500 hover:bg-slate-600 shadow-md px-6 py-2.5 rounded-full text-white font-bold transition-colors flex items-center gap-2 disabled:opacity-50">
                      <CornerUpLeft size={18} /> Đã gửi lời mời
                    </button>
                  )}
                  {friendStatus === 'received' && (
                    <button onClick={async () => {
                      if (!requestId) return;
                      setIsProcessing(true);
                      const res = await apiFetch(`/api/users/${currentUser.id}/friends/request/${requestId}`, {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'accepted' })
                      });
                      if (res.ok) await fetchFriendStatus();
                      setIsProcessing(false);
                    }} disabled={isProcessing} className="bg-indigo-600 hover:bg-indigo-500 shadow-md px-6 py-2.5 rounded-full text-white font-bold transition-colors flex items-center gap-2 disabled:opacity-50">
                      <Check size={18} /> Chấp nhận kết bạn
                    </button>
                  )}
                  {friendStatus === 'friends' && (
                    <button onClick={async () => {
                      if (window.confirm('Bạn có chắc chắn muốn hủy kết bạn với người này không?')) {
                        setIsProcessing(true);
                        const res = await apiFetch(`/api/users/${currentUser.id}/friends/${params.id}`, { method: 'DELETE' });
                        if (res.ok) await fetchFriendStatus();
                        setIsProcessing(false);
                      }
                    }} disabled={isProcessing} className="bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 px-6 py-2.5 rounded-full text-slate-700 font-bold transition-colors flex items-center gap-2 disabled:opacity-50">
                      <UserCheck size={18} /> Bạn bè
                    </button>
                  )}
                  <button onClick={handleMessage} className="bg-slate-100 hover:bg-slate-200 shadow-sm px-4 py-2.5 rounded-full text-slate-700 font-bold transition-colors flex items-center gap-2">
                    <MessageSquare size={18} /> Nhắn tin
                  </button>
                </>
              )}
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
              {parsedInfo?.major || user.department || 'Đang cập nhật'} • {parsedInfo?.cohort || user.cohort || 'Đang cập nhật'} • {user.studentId || 'Chưa có MSSV'}
            </p>
            <p className="text-slate-600 mt-4 leading-relaxed max-w-2xl text-[15px]">
              {user.bio || 'Chưa có tiểu sử.'}
            </p>
            <div className="flex gap-2 mt-4 flex-wrap">
              {user.reputationScore !== undefined && (
                 <span className="px-3 py-1 bg-yellow-50 text-yellow-600 font-bold rounded-full text-[13px] border border-yellow-200 flex items-center gap-1.5">
                    <Star size={14} className="fill-yellow-600" /> {user.reputationScore} Điểm
                 </span>
              )}
            </div>
            <div className="flex gap-6 mt-5 text-sm">
              <div className="cursor-pointer group"><span className="text-slate-800 font-bold group-hover:text-indigo-600 transition-colors">{friendCount}</span> <span className="text-slate-500 font-medium">Bạn bè</span></div>
              <div className="cursor-pointer group"><span className="text-slate-800 font-bold group-hover:text-indigo-600 transition-colors">0</span> <span className="text-slate-500 font-medium">Người theo dõi</span></div>
            </div>
          </div>
        </div>
        
        <div className="flex border-t border-slate-200 px-4 h-14">
          <button onClick={() => setActiveTab('posts')} className={`px-6 h-full font-bold transition-colors relative ${activeTab === 'posts' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>
            Bài viết
            {activeTab === 'posts' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-indigo-600 rounded-t-md shadow-sm"></div>}
          </button>
          <button onClick={() => setActiveTab('portfolio')} className={`px-6 h-full font-bold transition-colors relative ${activeTab === 'portfolio' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>
            Portfolio
            {activeTab === 'portfolio' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-indigo-600 rounded-t-md shadow-sm"></div>}
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="w-full flex gap-6">
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
                <span>Chuyên ngành <strong className="text-slate-800">{parsedInfo?.major || user.department || 'Đang cập nhật'}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin size={20} className="text-slate-500 shrink-0" />
                <span>Đến từ <strong className="text-slate-800">{user.location || 'Đang cập nhật'}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          {activeTab === 'portfolio' ? (
            <Portfolio userId={params!.id as string} isOwner={false} />
          ) : (
            <UserPostsTab userId={params!.id as string} />
          )}
        </div>
      </div>
    </div>
  );
}

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
  if (posts.length === 0) return <div className="glass border border-slate-200 rounded-3xl p-8 text-center text-slate-500">Người dùng này chưa có bài viết nào.</div>;

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
        </div>
      ))}
    </div>
  );
}
