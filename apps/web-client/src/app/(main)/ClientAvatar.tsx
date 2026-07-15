'use client';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';

interface ClientAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ClientAvatar({ size = 'md', className }: ClientAvatarProps) {
  const { user } = useAuthStore();
  
  // Lấy chữ cái đầu tiên của Tên (ví dụ "Nguyễn Văn A" -> "A")
  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

  return (
    <Avatar 
      size={size} 
      src={user?.avatarUrl || undefined} 
      fallback={getInitials(user?.fullName)} 
      className={`bg-primary text-white font-bold ${className || ''}`}
    />
  );
}
