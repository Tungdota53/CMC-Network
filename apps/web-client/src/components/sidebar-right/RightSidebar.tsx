'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, MoreHorizontal, Edit, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export function RightSidebar() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuthStore();

  const fetchFriends = useCallback(async () => {
    if (!user?.id) {
      setContacts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/friends', { params: { take: 10 } });
      
      let friendsList: any[] = [];
      if (Array.isArray(res.data?.data?.items)) friendsList = res.data.data.items;
      else if (Array.isArray(res.data?.data)) friendsList = res.data.data;
      else if (Array.isArray(res.data?.items)) friendsList = res.data.items;
      else if (Array.isArray(res.data)) friendsList = res.data;

      // Normalize data to match the UI expectations
      const normalizedContacts = friendsList.map((f: any) => {
        const friendData = f.addressee || f.requester || f.user || f;
        return {
          id: friendData.id,
          name: friendData.fullName || friendData.name || 'Không tên',
          avatarUrl: friendData.avatarUrl,
          isOnline: false,
          lastActive: 'gần đây'
        };
      }).filter((c: any) => c.id);
      setContacts(normalizedContacts);
    } catch (err) {
      console.error('Failed to fetch contacts', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const openConversation = async (contactId: string) => {
    if (!contactId || openingId) return;
    try {
      setOpeningId(contactId);
      const res = await api.post('/conversations', {
        type: 'DIRECT',
        participantIds: [contactId],
      });
      const conversation = res.data?.data || res.data;
      if (conversation?.id) {
        router.push(`/messages/t/${conversation.id}`);
      }
    } catch (err) {
      console.error('Failed to open conversation', err);
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="h-full flex flex-col py-4 pr-4 pl-2 overflow-y-auto">
      {/* Đoạn chat Widget */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4 text-foreground/60">
          <h3 className="font-semibold text-foreground/60">Đoạn chat</h3>
          <div className="flex gap-2">
            <button className="p-1.5 rounded-full hover:bg-hover transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-full hover:bg-hover transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-full hover:bg-hover transition-colors">
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="space-y-1">
          {loading ? (
             <div className="flex justify-center py-4">
               <Loader2 className="w-5 h-5 text-foreground/40 animate-spin" />
             </div>
          ) : contacts.length > 0 ? contacts.map(c => (
            <button key={c.id} type="button" onClick={() => openConversation(c.id)} disabled={openingId === c.id} className="flex w-full items-center gap-3 p-2 rounded-lg hover:bg-hover cursor-pointer transition-colors text-left disabled:opacity-60">
              <div className="relative">
                <Avatar fallback={c.name.charAt(0)} src={c.avatarUrl} size="sm" />
                {c.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{c.name}</p>
                <p className="text-xs text-foreground/60 truncate">
                  {c.isOnline ? 'Đang hoạt động' : `Hoạt động ${c.lastActive} trước`}
                </p>
              </div>
              {openingId === c.id && <Loader2 className="w-4 h-4 text-foreground/40 animate-spin" />}
            </button>
          )) : (
            <p className="text-sm text-foreground/40 text-center py-4">Chưa có liên hệ nào</p>
          )}
        </div>

        <Link href="/messages" className="block w-full mt-4 py-2 text-sm text-primary font-medium hover:bg-primary/10 rounded-lg transition-colors text-center">
          Xem tất cả trong Chat
        </Link>
      </div>

      <hr className="border-border mb-6" />

      {/* Liên hệ (Contacts online) */}
      <div>
        <div className="flex items-center justify-between mb-4 text-foreground/60">
          <h3 className="font-semibold text-foreground/60">Liên hệ đang online</h3>
          <div className="flex gap-2">
            <button className="p-1.5 rounded-full hover:bg-hover transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-full hover:bg-hover transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-1">
          {!loading && contacts.filter(c => c.isOnline).map(c => (
            <button key={c.id} type="button" onClick={() => openConversation(c.id)} disabled={openingId === c.id} className="flex w-full items-center gap-3 p-2 rounded-lg hover:bg-hover cursor-pointer transition-colors text-left disabled:opacity-60">
              <div className="relative">
                <Avatar fallback={c.name.charAt(0)} src={c.avatarUrl} size="sm" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full"></div>
              </div>
              <p className="font-medium text-sm text-foreground truncate">{c.name}</p>
              {openingId === c.id && <Loader2 className="w-4 h-4 text-foreground/40 animate-spin" />}
            </button>
          ))}
          {!loading && contacts.filter(c => c.isOnline).length === 0 && (
            <p className="text-sm text-foreground/40 text-center py-2">Không có liên hệ online</p>
          )}
        </div>
      </div>
    </div>
  );
}
