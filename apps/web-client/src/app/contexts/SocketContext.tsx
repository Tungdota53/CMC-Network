"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from './UserContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    // Chỉ kết nối khi có user đăng nhập
    if (!user) {
      const timeoutId = window.setTimeout(() => {
        setSocket((currentSocket) => {
          currentSocket?.disconnect();
          return null;
        });
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    if (!process.env.NEXT_PUBLIC_CHAT_SOCKET_URL) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_CHAT_SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      query: { userId: user.id }, // BE-004: presence/online + typing keyed theo user đang kết nối
    });

    socketInstance.on('connect', () => {
      console.log('✅ Connected to Chat Server via Socket.io');
      setIsConnected(true);
      
      // Có thể emit event online status ở đây
      // socketInstance.emit('userOnline', user.id);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Disconnected from Chat Server');
      setIsConnected(false);
    });

    const timeoutId = window.setTimeout(() => setSocket(socketInstance), 0);

    return () => {
      window.clearTimeout(timeoutId);
      socketInstance.disconnect();
    };
  }, [user?.id]); // Phụ thuộc vào id của user để reconnect khi chuyển acc

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
