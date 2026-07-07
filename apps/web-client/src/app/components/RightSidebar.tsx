"use client";

import { useCallback, useEffect, useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { apiFetch } from '../lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

type UserSummary = {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
  major?: string | null;
  cohort?: string | null;
};

type FriendRequest = {
  id: string;
  sender?: UserSummary;
  receiver?: UserSummary;
};

const USER_API_URL = '/api';

const getAvatar = (user: UserSummary) => {
  if (user?.avatarUrl) {
    return user.avatarUrl.startsWith('http') ? user.avatarUrl : user.avatarUrl;
  }
  return `https://i.pravatar.cc/150?u=${user.id}`;
};

export default function RightSidebar() {
  const { user: currentUser } = useUser();
  const [friends, setFriends] = useState<UserSummary[]>([]);
  const [suggestions, setSuggestions] = useState<UserSummary[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [friendSearch, setFriendSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserSummary[]>([]);
  const [isSearchingFriends, setIsSearchingFriends] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchFriendsData = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const [friendsResponse, suggestionsResponse, incomingResponse, sentResponse] = await Promise.all([
        apiFetch(`${USER_API_URL}/users/${userId}/friends`),
        apiFetch(`${USER_API_URL}/users/${userId}/friends/suggestions`),
        apiFetch(`${USER_API_URL}/users/${userId}/friends/requests`),
        apiFetch(`${USER_API_URL}/users/${userId}/friends/requests/sent`),
      ]);

      if (friendsResponse.ok) setFriends(await friendsResponse.json());
      if (suggestionsResponse.ok) setSuggestions(await suggestionsResponse.json());
      if (incomingResponse.ok) setIncomingRequests(await incomingResponse.json());
      if (sentResponse.ok) setSentRequests(await sentResponse.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      fetchFriendsData(currentUser.id);
    }
  }, [currentUser?.id, fetchFriendsData]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const keyword = friendSearch.trim();
    if (keyword.length < 2) {
      const resetTimer = window.setTimeout(() => {
        setSearchResults([]);
        setIsSearchingFriends(false);
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }

    const startTimer = window.setTimeout(() => setIsSearchingFriends(true), 0);
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await apiFetch(`${USER_API_URL}/users/${currentUser.id}/friends/search?q=${encodeURIComponent(keyword)}`);
        if (response.ok) setSearchResults(await response.json());
      } finally {
        setIsSearchingFriends(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(timeoutId);
    };
  }, [currentUser?.id, friendSearch]);

  const handleAddFriend = async (receiverId: string) => {
    if (!currentUser) return;

    try {
      const response = await apiFetch(`${USER_API_URL}/users/${currentUser.id}/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId }),
      });

      if (response.ok) {
        setFriendSearch('');
        setSearchResults([]);
        await fetchFriendsData(currentUser.id);
        toast.success('Đã gửi lời mời kết bạn');
      } else {
        const err = await response.json();
        toast.error('Lỗi: ' + (err.message || 'Không thể gửi lời mời'));
      }
    } catch (e) {
      console.error(e);
      toast.error('Đã xảy ra lỗi mạng!');
    }
  };

  const handleRespondRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    if (!currentUser) return;

    const response = await apiFetch(`${USER_API_URL}/users/${currentUser.id}/friends/request/${requestId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (response.ok) await fetchFriendsData(currentUser.id);
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!currentUser) return;

    const response = await apiFetch(`${USER_API_URL}/users/${currentUser.id}/friends/request/${requestId}`, {
      method: 'DELETE',
    });

    if (response.ok) await fetchFriendsData(currentUser.id);
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!currentUser) return;

    const response = await apiFetch(`${USER_API_URL}/users/${currentUser.id}/friends/${friendId}`, {
      method: 'DELETE',
    });

    if (response.ok) await fetchFriendsData(currentUser.id);
  };

  return (
    <div className="hidden md:block w-[320px] shrink-0 sticky top-24 h-[calc(100vh-100px)] overflow-y-auto no-scrollbar pb-6 pl-4 pr-2">
      <div className="glass p-4 mb-5">
        <h3 className="font-semibold text-token-tertiary text-xs uppercase tracking-wider mb-4 pl-1">Tài trợ</h3>
        <div className="flex gap-4 cursor-pointer group p-2 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-xl transition-colors">
          <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=200&q=80" className="w-20 h-20 rounded-xl object-cover opacity-80 group-hover:opacity-100 transition-all group-hover:scale-105" alt="" />
          <div className="flex-1 flex flex-col justify-center">
            <h4 className="font-semibold text-token-primary text-[14px] leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Khóa Học Fullstack Pro</h4>
            <span className="text-[12px] text-token-tertiary mt-1">cmc.edu.vn</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-3 px-2">
        <h3 className="font-semibold text-token-tertiary text-xs uppercase tracking-wider">Lời mời kết bạn</h3>
        {incomingRequests.length > 0 && <span className="text-[10px] font-bold bg-indigo-600 text-white rounded-full px-2 py-0.5">{incomingRequests.length}</span>}
      </div>

      <div className="glass p-2 flex flex-col gap-1 mb-5">
        {loading && <p className="text-token-tertiary text-center text-sm p-4">Đang tải...</p>}
        {!loading && incomingRequests.length === 0 && <p className="text-token-tertiary text-center text-sm p-4">Không có lời mời mới</p>}

        {incomingRequests.map((request) => request.sender && (
          <div key={request.id} className="p-3 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-xl transition-colors">
            <div className="flex items-center gap-3">
              <img src={getAvatar(request.sender)} className="w-10 h-10 rounded-full object-cover" alt="" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-token-primary text-sm truncate">{request.sender.fullName}</p>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 truncate mt-0.5">{request.sender.major || request.sender.cohort || 'Cùng trường'}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => handleRespondRequest(request.id, 'accepted')} className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors">Xác nhận</button>
              <button onClick={() => handleRespondRequest(request.id, 'rejected')} className="flex-1 py-1.5 rounded-lg surface-subtle hover:bg-slate-200 dark:hover:bg-slate-700 text-token-secondary text-xs font-medium transition-colors">Xóa</button>
            </div>
          </div>
        ))}
      </div>

      {sentRequests.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-3 px-2">
            <h3 className="font-semibold text-token-tertiary text-xs uppercase tracking-wider">Đã gửi</h3>
          </div>
          <div className="glass p-2 flex flex-col gap-1 mb-5">
            {sentRequests.map((request) => request.receiver && (
              <div key={request.id} className="flex items-center justify-between p-2 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-xl transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={getAvatar(request.receiver)} className="w-9 h-9 rounded-full object-cover" alt="" />
                  <div className="min-w-0">
                    <p className="font-medium text-token-primary text-[13px] truncate max-w-[140px]">{request.receiver.fullName}</p>
                    <p className="text-[11px] text-token-tertiary mt-0.5">Đang chờ phản hồi</p>
                  </div>
                </div>
                <button onClick={() => handleCancelRequest(request.id)} className="px-3 py-1 rounded-lg surface-subtle hover:bg-red-500 hover:text-white text-token-secondary text-xs transition-colors">Hủy</button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex justify-between items-center mb-3 px-2">
        <h3 className="font-semibold text-token-tertiary text-xs uppercase tracking-wider">Tìm bạn bè</h3>
      </div>

      <div className="glass p-3 flex flex-col gap-2 mb-5">
        <div className="relative group">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-token-tertiary group-focus-within:text-indigo-600 transition-colors" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input
            value={friendSearch}
            onChange={(event) => setFriendSearch(event.target.value)}
            placeholder="Nhập tên, mã SV..."
            className="w-full rounded-xl surface-subtle border border-slate-200 dark:border-slate-700 py-2 pl-9 pr-3 text-sm text-token-primary placeholder:text-token-tertiary outline-none focus:border-indigo-400 focus:surface transition-all"
          />
        </div>

        {isSearchingFriends && <p className="text-token-tertiary text-center text-sm p-2">Đang tìm...</p>}
        {!isSearchingFriends && friendSearch.trim().length >= 2 && searchResults.length === 0 && <p className="text-token-tertiary text-center text-sm p-2">Không tìm thấy người phù hợp</p>}

        {searchResults.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-2 mt-1 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-xl transition-colors group">
            <div className="flex items-center gap-3 min-w-0">
              <img src={getAvatar(user)} className="w-9 h-9 rounded-full opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-token-secondary text-[13px] group-hover:text-token-primary truncate max-w-[130px]">{user.fullName}</span>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 truncate max-w-[130px] mt-0.5">{user.major || user.cohort || 'Cùng trường'}</span>
              </div>
            </div>
            <button
              onClick={() => handleAddFriend(user.id)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
            >
              Kết bạn
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-3 px-2">
        <h3 className="font-semibold text-token-tertiary text-xs uppercase tracking-wider">Gợi ý kết bạn</h3>
      </div>

      <div className="glass p-2 flex flex-col gap-1 mb-5">
        {loading && <p className="text-token-tertiary text-center text-sm p-4">Đang tải...</p>}
        {!loading && suggestions.length === 0 && <p className="text-token-tertiary text-center text-sm p-4">Chưa có gợi ý nào</p>}

        {suggestions.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-2 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-xl transition-colors group">
            <Link href={`/profile/${user.id}`} className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
              <img src={getAvatar(user)} className="w-9 h-9 rounded-full opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-token-secondary text-[13px] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate max-w-[140px]">{user.fullName}</span>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 truncate max-w-[140px] mt-0.5">{user.major || user.cohort || 'Cùng trường'}</span>
              </div>
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddFriend(user.id);
              }}
              className="p-1.5 rounded-lg surface-subtle hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-token-secondary hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/50"
              title="Thêm bạn bè"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-3 px-2 mt-2">
        <h3 className="font-semibold text-token-tertiary text-xs uppercase tracking-wider">Người liên hệ</h3>
        <div className="flex gap-3 text-token-tertiary">
          <svg className="cursor-pointer hover:text-token-primary transition-colors" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <svg className="cursor-pointer hover:text-token-primary transition-colors" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"/></svg>
        </div>
      </div>

      <div className="glass p-2 flex flex-col gap-1">
        {loading && <p className="text-token-tertiary text-center text-sm p-4">Đang tải...</p>}
        {!loading && friends.length === 0 && <p className="text-token-tertiary text-center text-sm p-4">Bạn chưa có bạn bè nào</p>}

        {friends.map((contact) => (
          <div key={contact.id} className="flex items-center justify-between p-2 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-xl transition-colors group">
            <Link
              href={`/profile/${contact.id}`}
              className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
            >
              <div className="relative shrink-0">
                <img src={getAvatar(contact)} className="w-9 h-9 rounded-full opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800"></div>
              </div>
              <span className="font-medium text-token-secondary text-[14px] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{contact.fullName}</span>
            </Link>
            <button onClick={() => handleRemoveFriend(contact.id)} className="px-2 py-1 rounded-lg text-[11px] font-medium text-token-tertiary hover:text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100">Xóa</button>
          </div>
        ))}
      </div>
    </div>
  );
}
