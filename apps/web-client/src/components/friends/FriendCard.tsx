'use client';

import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FriendUser, useFriendMutations } from '@/hooks/useFriends';
import { UserCheck, UserMinus, UserPlus, X, Ban } from 'lucide-react';

export type FriendCardType = 'FRIEND' | 'INCOMING' | 'OUTGOING' | 'SUGGESTION' | 'BLOCKED';

interface FriendCardProps {
  user: FriendUser;
  type: FriendCardType;
}

export function FriendCard({ user, type }: FriendCardProps) {
  const { sendRequest, acceptRequest, rejectRequest, cancelRequest, removeFriend, unblockUser } = useFriendMutations();

  const handleAction = async (action: 'ADD' | 'ACCEPT' | 'REJECT' | 'CANCEL' | 'UNFRIEND' | 'UNBLOCK') => {
    try {
      if (action === 'ADD') await sendRequest.mutateAsync(user.id);
      if (action === 'ACCEPT') await acceptRequest.mutateAsync(user.id);
      if (action === 'REJECT') await rejectRequest.mutateAsync(user.id);
      if (action === 'CANCEL') await cancelRequest.mutateAsync(user.id);
      if (action === 'UNFRIEND') await removeFriend.mutateAsync(user.id);
      if (action === 'UNBLOCK') await unblockUser.mutateAsync(user.id);
    } catch (err) {
      console.error('Lỗi khi thực hiện hành động:', err);
    }
  };

  return (
    <div className="bg-card/60 backdrop-blur-md rounded-2xl shadow-sm border border-border/40 overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 group">
      {/* Cover/Avatar Area */}
      <Link href={`/profile/${user.profileSlug}`} className="block relative aspect-square w-full bg-hover overflow-hidden">
        <img
          src={user.avatarUrl || `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#e2e8f0"/><text x="50%" y="50%" font-size="120" text-anchor="middle" dy=".35em" fill="#94a3b8">${(user.fullName || '?')[0]}</text></svg>`)}`}
          alt={user.fullName}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
        />
        {/* Subtle overlay for depth on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </Link>

      {/* Info & Actions */}
      <div className="p-4 flex-1 flex flex-col bg-card/80 relative z-10">
        <Link href={`/profile/${user.profileSlug}`} className="font-bold text-[16px] text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-0.5">
          {user.fullName}
        </Link>
        
        {/* Sub-info (Mutual or Academic Year) */}
        <div className="text-[13px] font-medium text-foreground/50 mb-4 h-5 flex items-center">
          {user.mutualCount !== undefined && user.mutualCount > 0 ? (
            <span>{user.mutualCount} bạn chung</span>
          ) : user.academicYear ? (
            <span>Khóa {user.academicYear}</span>
          ) : (
            <span className="opacity-0">-</span>
          )}
        </div>

        {/* Buttons based on Type */}
        <div className="mt-auto space-y-2">
          {type === 'INCOMING' && (
            <>
              <Button 
                onClick={() => handleAction('ACCEPT')} 
                disabled={acceptRequest.isPending}
                className="w-full bg-primary hover:bg-primary/90 text-white text-sm rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm shadow-primary/20"
              >
                Xác nhận
              </Button>
              <Button 
                onClick={() => handleAction('REJECT')} 
                disabled={rejectRequest.isPending}
                variant="outline" 
                className="w-full text-sm bg-hover hover:bg-foreground/10 text-foreground border-none rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Xóa
              </Button>
            </>
          )}

          {type === 'SUGGESTION' && (
            <>
              <Button 
                onClick={() => handleAction('ADD')} 
                disabled={sendRequest.isPending}
                className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-white text-sm flex items-center justify-center gap-2 border-none rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Thêm bạn bè
              </Button>
              <Button 
                variant="outline" 
                className="w-full text-sm bg-hover hover:bg-foreground/10 text-foreground border-none rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Gỡ
              </Button>
            </>
          )}

          {type === 'FRIEND' && (
            <Button 
              onClick={() => handleAction('UNFRIEND')} 
              disabled={removeFriend.isPending}
              variant="outline" 
              className="w-full text-sm bg-hover hover:bg-foreground/10 text-foreground border-none flex items-center justify-center gap-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <UserCheck className="w-4 h-4" />
              Bạn bè
            </Button>
          )}

          {type === 'OUTGOING' && (
            <Button 
              onClick={() => handleAction('CANCEL')} 
              disabled={cancelRequest.isPending}
              variant="outline" 
              className="w-full text-sm bg-hover hover:bg-foreground/10 text-foreground border-none flex items-center justify-center gap-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <UserMinus className="w-4 h-4" />
              Hủy lời mời
            </Button>
          )}

          {type === 'BLOCKED' && (
            <Button 
              onClick={() => handleAction('UNBLOCK')} 
              disabled={unblockUser.isPending}
              variant="outline" 
              className="w-full text-sm bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-none flex items-center justify-center gap-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Ban className="w-4 h-4" />
              Bỏ chặn
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
