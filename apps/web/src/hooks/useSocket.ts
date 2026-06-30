'use client';

import { useEffect } from 'react';
import { useSocketContext } from '../providers/SocketProvider';

/**
 * Custom hook to interact with the global Socket.IO connection.
 * Automatically handles event listener setup and cleanup.
 * 
 * @param event The event name to listen to (e.g., 'issue:created')
 * @param callback The function to execute when the event fires
 * @returns The socket instance and connection status
 */
export const useSocket = (event?: string, callback?: (data: any) => void) => {
  const { socket, isConnected } = useSocketContext();

  useEffect(() => {
    if (!socket || !event || !callback) return;

    socket.on(event, callback);

    return () => {
      socket.off(event, callback);
    };
  }, [socket, event, callback]);

  return { socket, isConnected };
};
