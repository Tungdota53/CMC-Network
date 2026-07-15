'use client';

import React, { useEffect, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';

// Fake implementation for layout
export const ChatNotificationPopup = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Test: Hiển thị sau 5s
  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 5000);
    return () => clearTimeout(t);
  }, []);

  return null; // Deleted static data
};
