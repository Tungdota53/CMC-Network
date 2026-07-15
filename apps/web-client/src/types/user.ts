export type UserRole = 'STUDENT' | 'LECTURER' | 'MODERATOR' | 'ADMIN';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'BANNED';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  studentId?: string;
  profileSlug: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  hasBlueBadge?: boolean;
  reputationScore: number;
}
