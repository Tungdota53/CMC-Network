'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, X } from 'lucide-react';
import api from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';

type Friend = {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  major?: string | null;
  email?: string | null;
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CreateGroupDialog = ({ open, onClose }: Props) => {
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setLoading(true);
    api
      .get('/friends')
      .then((res) => {
        const data = res.data?.data || [];
        setFriends(Array.isArray(data) ? data : []);
      })
      .catch(() => setError('Không tải được danh sách bạn bè.'))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      api
        .get('/friends/search', { params: { q: query.trim() } })
        .then((res) => {
          const data = res.data?.data || [];
          setSearchResults(Array.isArray(data) ? data : []);
        })
        .catch(() => setSearchResults([]));
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [open, query]);

  const filteredFriends = useMemo(() => {
    const byId = new Map<string, Friend>();
    friends.forEach((friend) => byId.set(friend.id, friend));
    searchResults.forEach((friend) => byId.set(friend.id, friend));
    const allCandidates = Array.from(byId.values());
    const keyword = query.trim().toLowerCase();
    if (!keyword) return allCandidates;
    return allCandidates.filter((friend) => {
      const haystack = `${friend.fullName || ''} ${friend.email || ''} ${friend.major || ''}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [friends, searchResults, query]);

  const selectedFriends = useMemo(() => {
    const byId = new Map<string, Friend>();
    friends.forEach((friend) => byId.set(friend.id, friend));
    searchResults.forEach((friend) => byId.set(friend.id, friend));
    return selectedIds.map((id) => byId.get(id)).filter(Boolean) as Friend[];
  }, [friends, searchResults, selectedIds]);

  const toggleMember = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const handleCreate = async () => {
    if (selectedIds.length < 1) {
      setError('Chọn ít nhất 1 thành viên để tạo nhóm.');
      return;
    }

    setCreating(true);
    setError('');
    try {
      const res = await api.post('/conversations', {
        type: 'GROUP',
        name: groupName.trim() || `Nhóm ${selectedFriends.map((friend) => friend.fullName).join(', ')}`,
        participantIds: selectedIds,
      });
      const conversation = res.data?.data;
      if (!conversation?.id) {
        throw new Error('Backend không trả về ID nhóm chat.');
      }
      onClose();
      setSelectedIds([]);
      setGroupName('');
      setQuery('');
      router.push(`/messages/t/${conversation.id}`);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || err?.error?.message || 'Không tạo được nhóm chat.';
      setError(Array.isArray(message) ? message.join('; ') : message);
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Tạo nhóm chat</h3>
              <p className="text-xs text-muted-foreground">Chọn bạn bè để bắt đầu nhóm mới.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

          <input
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            placeholder="Tên nhóm, có thể bỏ trống"
            className="h-11 w-full rounded-2xl border border-border bg-muted/50 px-4 text-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
          />

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm bạn bè"
              className="h-11 w-full rounded-2xl border border-border bg-muted/50 pl-11 pr-4 text-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
            />
          </div>

          {selectedFriends.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedFriends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => toggleMember(friend.id)}
                  className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
                >
                  {friend.fullName}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}

          <div className="max-h-72 space-y-1 overflow-y-auto rounded-2xl border border-border bg-muted/20 p-2">
            {loading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Đang tải bạn bè...</div>
            ) : filteredFriends.length > 0 ? (
              filteredFriends.map((friend) => {
                const checked = selectedIds.includes(friend.id);
                return (
                  <button
                    key={friend.id}
                    onClick={() => toggleMember(friend.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-2 text-left transition ${
                      checked ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-muted'
                    }`}
                  >
                    <Avatar src={friend.avatarUrl || undefined} fallback={friend.fullName?.charAt(0) || 'U'} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{friend.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">{friend.major || friend.email || 'Bạn bè'}</p>
                    </div>
                    <span
                      className={`h-5 w-5 rounded-full border ${
                        checked ? 'border-primary bg-primary shadow-inner' : 'border-border bg-background'
                      }`}
                    />
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">Không tìm thấy bạn bè phù hợp.</div>
            )}
          </div>

          <Button onClick={handleCreate} isLoading={creating} className="w-full rounded-2xl">
            Tạo nhóm chat
          </Button>
        </div>
      </div>
    </div>
  );
};
