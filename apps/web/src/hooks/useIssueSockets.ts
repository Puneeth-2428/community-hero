import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketState {
  isConnected: boolean;
  voteCounts: {
    UPVOTE: number;
    VERIFY: number;
    DISPUTE: number;
  };
  upvoteCount: number;
  status: string;
}

export function useIssueSockets(issueId: string, initialCounts: any, initialStatus: string) {
  const [socketState, setSocketState] = useState<SocketState>({
    isConnected: false,
    voteCounts: initialCounts,
    upvoteCount: initialCounts.UPVOTE || 0,
    status: initialStatus,
  });

  useEffect(() => {
    // Assuming backend runs on 4000
    const socket: Socket = io('http://localhost:4000', {
      withCredentials: true,
    });

    socket.on('connect', () => {
      setSocketState((prev) => ({ ...prev, isConnected: true }));
      socket.emit('joinIssueRoom', issueId);
    });

    socket.on('disconnect', () => {
      setSocketState((prev) => ({ ...prev, isConnected: false }));
    });

    socket.on('issueStatusChanged', (data: { issueId: string; newStatus: string }) => {
      if (data.issueId === issueId) {
        setSocketState((prev) => ({ ...prev, status: data.newStatus }));
      }
    });

    socket.on('voteCountsUpdated', (data: { issueId: string; counts: any; upvoteCount: number }) => {
      if (data.issueId === issueId) {
        setSocketState((prev) => ({
          ...prev,
          voteCounts: data.counts,
          upvoteCount: data.upvoteCount,
        }));
      }
    });

    return () => {
      socket.emit('leaveIssueRoom', issueId);
      socket.disconnect();
    };
  }, [issueId]);

  return socketState;
}
