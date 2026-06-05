import React from 'react';

export interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy';
  className?: string;
}

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-9 h-9 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

const statusColor: Record<NonNullable<AvatarProps['status']>, string> = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  busy: 'bg-red-500',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  initials,
  size = 'md',
  status,
  className = '',
}) => {
  const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-pink-500',
    'bg-indigo-500', 'bg-green-500', 'bg-yellow-500',
  ];
  const randomColor = colors[(initials?.length || 0) % colors.length];

  return (
    <div className={`relative inline-block ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} ${randomColor} rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-white`}
        >
          {initials?.charAt(0).toUpperCase() || '?'}
        </div>
      )}
      {status && (
        <span
          className={`absolute bottom-0 right-0 block w-3 h-3 ${statusColor[status]} ring-2 ring-white rounded-full`}
        />
      )}
    </div>
  );
};
