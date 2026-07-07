"use client";

import React, { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch } from '../lib/api';



export const parseStudentId = (studentId: string) => {
  if (!studentId || typeof studentId !== 'string') return null;
  const match = studentId.match(/^B([a-zA-Z]{2})(\d{2})/i);
  if (!match) return null;
  
  const code = match[1].toUpperCase();
  const yearStr = match[2];
  const year = parseInt(yearStr, 10);
  const cohortNum = year - 21; // 22 -> K1, 23 -> K2, 24 -> K3, 25 -> K4
  
  const majors: Record<string, { name: string, faculty: string }> = {
    'AI': { name: 'Trí tuệ Nhân tạo', faculty: 'Khoa Công nghệ Thông tin' },
    'BA': { name: 'Quản trị Kinh doanh', faculty: 'Khoa Kinh doanh & Quản trị' },
    'CB': { name: 'Tiếng Trung Thương mại', faculty: 'Khoa Ngôn ngữ & Văn hóa' },
    'CL': { name: 'Ngôn ngữ Trung Quốc', faculty: 'Khoa Ngôn ngữ & Văn hóa' },
    'CS': { name: 'Khoa học Máy tính', faculty: 'Khoa Công nghệ Thông tin' },
    'DA': { name: 'Thiết kế Mỹ thuật số', faculty: 'Khoa Thiết kế & Truyền thông' },
    'EC': { name: 'Công nghệ Kỹ thuật Điện tử - Viễn thông', faculty: 'Khoa Công nghệ Thông tin' },
    'EM': { name: 'Thương mại Điện tử', faculty: 'Khoa Kinh doanh & Quản trị' },
    'GA': { name: 'Đồ họa Game', faculty: 'Khoa Thiết kế & Truyền thông' },
    'GD': { name: 'Thiết kế Đồ họa', faculty: 'Khoa Thiết kế & Truyền thông' },
    'IB': { name: 'Kinh doanh Quốc tế', faculty: 'Khoa Kinh doanh & Quản trị' },
    'IT': { name: 'Công nghệ Thông tin', faculty: 'Khoa Công nghệ Thông tin' },
    'KL': { name: 'Ngôn ngữ Hàn Quốc', faculty: 'Khoa Ngôn ngữ & Văn hóa' },
    'LS': { name: 'Logistics và Quản lý chuỗi cung ứng', faculty: 'Khoa Kinh doanh & Quản trị' },
    'MC': { name: 'Truyền thông Đa phương tiện', faculty: 'Khoa Thiết kế & Truyền thông' },
    'MK': { name: 'Digital Marketing', faculty: 'Khoa Kinh doanh & Quản trị' },
    'NS': { name: 'An ninh Mạng', faculty: 'Khoa Công nghệ Thông tin' },
    'PR': { name: 'Quan hệ Công chúng', faculty: 'Khoa Thiết kế & Truyền thông' },
    'SE': { name: 'Kỹ thuật Phần mềm', faculty: 'Khoa Công nghệ Thông tin' }
  };
  
  const info = majors[code] || { name: 'Chưa xác định', faculty: 'Chưa xác định' };
  
  return {
    major: info.name,
    faculty: info.faculty,
    cohort: cohortNum > 0 ? `K${cohortNum}` : 'Không xác định'
  };
};

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  studentId: string;
  department: string | null;
  major: string | null;
  cohort: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  reputationScore: number;
  badges?: unknown[];
  role: string;
  isVerified: boolean;
}

interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const userInfoStr = localStorage.getItem('user_info');
      if (!userInfoStr) {
        setIsLoading(false);
        return;
      }
      const userInfo = JSON.parse(userInfoStr) as { id: string; role?: string };
      const userId = userInfo.id;

      const res = await apiFetch(`/api/users/${userId}`);
      if (res.ok) {
        const data = await res.json() as Partial<UserProfile>;
        const parsed = data.studentId ? parseStudentId(data.studentId) : null;
        setUser({
          ...data,
          id: data.id || userId,
          email: data.email || '',
          department: data.department || null,
          location: data.location || null,
          reputationScore: data.reputationScore || 0,
          avatarUrl: data.avatarUrl || null,
          bio: data.bio || 'Chưa có tiểu sử.',
          major: data.major || parsed?.major || 'Chưa xác định',
          cohort: data.cohort || parsed?.cohort || 'Không xác định',
          studentId: data.studentId || 'SV001',
          fullName: data.fullName || 'Người Dùng Ẩn Danh',
          role: data.role || userInfo.role || 'STUDENT',
          isVerified: data.isVerified || false
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin người dùng:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void fetchProfile(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchProfile]);

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      if (!user) return;
      const res = await apiFetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setUser(prev => prev ? { ...prev, ...data } : null);
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin:', error);
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      if (!user) return;
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await apiFetch(`/api/users/${user.id}/avatar`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const result = await res.json();
        setUser(prev => prev ? { ...prev, avatarUrl: result.avatarUrl } : null);
      }
    } catch (error) {
      console.error('Lỗi upload avatar:', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, isLoading, updateProfile, uploadAvatar }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
