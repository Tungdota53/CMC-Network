'use client';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';

interface ClientAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ClientAvatar({ size = 'md', className }: ClientAvatarProps) {
  const { user } = useAuthStore();
  
  const getInitials = (name?: string) => {
    if (!name?.trim()) return undefined;
    const parts = name.trim().split(/\s+/);
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

  const initials = getInitials(user?.fullName);

  return (
    <Avatar 
      size={size} 
      src={user?.avatarUrl || undefined} 
      fallback={initials} 
      className={initials ? `bg-primary text-primary-foreground font-bold ${className || ''}` : className}
    />
  );
}
