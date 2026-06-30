'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useSocket } from '../hooks/useSocket';

export const GlobalSocketListeners = () => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const onIssueCreated = (issue: any) => {
      toast.success('New Issue Reported Nearby', {
        description: issue.title,
      });
    };

    const onIssueVerified = (data: any) => {
      toast.success('Issue Community Verified!', {
        description: data.title,
        icon: '✅',
      });
    };

    const onNotificationNew = (notification: any) => {
      toast('New Notification', {
        description: notification.message,
      });
    };

    socket.on('issue:created', onIssueCreated);
    socket.on('issue:verified', onIssueVerified);
    socket.on('notification:new', onNotificationNew);

    return () => {
      socket.off('issue:created', onIssueCreated);
      socket.off('issue:verified', onIssueVerified);
      socket.off('notification:new', onNotificationNew);
    };
  }, [socket]);

  return null;
};
