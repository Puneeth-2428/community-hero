'use client';

import React, { useState, useEffect } from 'react';
import { ThumbsUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';

interface VerificationPanelProps {
  issueId: string;
  userId: string;
  initialCounts: {
    UPVOTE: number;
    VERIFY: number;
    DISPUTE: number;
  };
  initialStatus: string;
}

export const VerificationPanel = ({ issueId, userId, initialCounts, initialStatus }: VerificationPanelProps) => {
  const { socket, isConnected } = useSocket();
  const [voteCounts, setVoteCounts] = useState(initialCounts);
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (!socket) return;

    socket.emit('joinIssueRoom', issueId);

    const onStatusChanged = (data: { issueId: string; newStatus: string }) => {
      if (data.issueId === issueId) setStatus(data.newStatus);
    };

    const onVotesUpdated = (data: { issueId: string; counts: any }) => {
      if (data.issueId === issueId) setVoteCounts(data.counts);
    };

    socket.on('issue:status_changed', onStatusChanged);
    socket.on('issue:vote_counts_updated', onVotesUpdated);

    return () => {
      socket.emit('leaveIssueRoom', issueId);
      socket.off('issue:status_changed', onStatusChanged);
      socket.off('issue:vote_counts_updated', onVotesUpdated);
    };
  }, [issueId, socket]);

  // Local storage state to prevent duplicate votes in UI
  const [hasVoted, setHasVoted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const lsKey = `votes_${userId}_${issueId}`;
    const stored = localStorage.getItem(lsKey);
    if (stored) {
      setHasVoted(JSON.parse(stored));
    }
  }, [userId, issueId]);

  const castVote = async (type: 'UPVOTE' | 'VERIFY' | 'DISPUTE') => {
    if (hasVoted[type] || hasVoted['ANY']) return; // Check if already voted

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/issues/${issueId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, userId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to vote');
      }

      // Record vote in local storage to lock all buttons
      const updatedVotes = { ...hasVoted, [type]: true, ANY: true };
      setHasVoted(updatedVotes);
      localStorage.setItem(`votes_${userId}_${issueId}`, JSON.stringify(updatedVotes));
    } catch (error) {
      console.error(error);
      alert('Failed to cast vote.');
    }
  };

  const isVerified = status === 'VERIFIED';
  const verifyProgress = Math.min(voteCounts.VERIFY / 5 * 100, 100);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800">Community Verification</h3>
        
        {/* Real-time Indicator */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
          {isConnected ? 'Live' : 'Connecting...'}
        </div>
      </div>

      {/* Verified Badge */}
      <AnimatePresence>
        {isVerified && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center gap-3 font-medium"
          >
            <CheckCircle className="w-5 h-5 text-green-600" />
            This issue has been Community Verified!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      {!isVerified && (
        <div className="mb-8">
          <div className="flex justify-between text-sm font-medium text-slate-600 mb-2">
            <span>Verification Progress</span>
            <span>{voteCounts.VERIFY} of 5</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-blue-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${verifyProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3">
        {/* Upvote */}
        <button 
          disabled={hasVoted['ANY']}
          onClick={() => castVote('UPVOTE')}
          className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all border ${
            hasVoted['UPVOTE'] 
              ? 'bg-blue-50 border-blue-200 text-blue-700' 
              : hasVoted['ANY'] ? 'bg-slate-50 border-slate-100 text-slate-400 opacity-50' : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700'
          }`}
        >
          <ThumbsUp className={`w-6 h-6 mb-2 ${hasVoted['UPVOTE'] ? 'fill-blue-100' : ''}`} />
          <span className="text-xs font-semibold uppercase tracking-wider mb-1">Upvote</span>
          <AnimatedCounter value={voteCounts.UPVOTE} />
        </button>

        {/* Verify */}
        <button 
          disabled={hasVoted['ANY']}
          onClick={() => castVote('VERIFY')}
          className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all border ${
            hasVoted['VERIFY'] 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : hasVoted['ANY'] ? 'bg-slate-50 border-slate-100 text-slate-400 opacity-50' : 'bg-white border-slate-200 hover:border-green-400 hover:bg-green-50 text-slate-700'
          }`}
        >
          <CheckCircle className="w-6 h-6 mb-2" />
          <span className="text-xs font-semibold uppercase tracking-wider mb-1">Verify</span>
          <AnimatedCounter value={voteCounts.VERIFY} />
        </button>

        {/* Dispute */}
        <button 
          disabled={hasVoted['ANY']}
          onClick={() => castVote('DISPUTE')}
          className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all border ${
            hasVoted['DISPUTE'] 
              ? 'bg-red-50 border-red-200 text-red-700' 
              : hasVoted['ANY'] ? 'bg-slate-50 border-slate-100 text-slate-400 opacity-50' : 'bg-white border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-700'
          }`}
        >
          <AlertTriangle className="w-6 h-6 mb-2" />
          <span className="text-xs font-semibold uppercase tracking-wider mb-1">Dispute</span>
          <AnimatedCounter value={voteCounts.DISPUTE} />
        </button>
      </div>
    </div>
  );
};

// Sub-component for animating number changes
const AnimatedCounter = ({ value }: { value: number }) => {
  return (
    <div className="relative overflow-hidden h-6 w-full flex justify-center items-center">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute text-lg font-bold"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};
