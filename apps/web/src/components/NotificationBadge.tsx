'use client';

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Bell } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export const NotificationBadge = ({ userId }: { userId: string }) => {
  const { data, mutate } = useSWR(`http://localhost:4000/api/v1/notifications?userId=${userId}`, fetcher);
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (data?.unreadCount !== undefined) {
      setUnreadCount(data.unreadCount);
    }
  }, [data]);

  useEffect(() => {
    if (!socket) return;

    const onNotificationNew = () => {
      setUnreadCount(prev => prev + 1);
      mutate();
    };

    socket.on('notification:new', onNotificationNew);

    return () => {
      socket.off('notification:new', onNotificationNew);
    };
  }, [socket, mutate]);

  return (
    <div className="relative inline-flex items-center p-2 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
      <Bell className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
};
