'use client';

import React, { useState, useEffect } from 'react';
import useSWRInfinite from 'swr/infinite';
import { CommentItem, CommentType } from './CommentItem';
import { useSocket } from '@/hooks/useSocket';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface CommentThreadProps {
  issueId: string;
  currentUserId: string; // From auth session
}

export const CommentThread = ({ issueId, currentUserId }: CommentThreadProps) => {
  const { socket } = useSocket();
  const [newText, setNewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SWR Infinite fetching
  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.data.length) return null; // reached the end
    return `http://localhost:4000/api/v1/issues/${issueId}/comments?page=${pageIndex + 1}&limit=20`;
  };

  const { data, error, mutate, size, setSize, isValidating } = useSWRInfinite(getKey, fetcher);

  // Flatten pages
  const comments: CommentType[] = data ? data.flatMap(page => page.data) : [];

  useEffect(() => {
    if (!socket) return;

    socket.emit('joinIssueRoom', issueId);

    const onNewComment = (newComment: CommentType) => {
      mutate(async (currentData: any) => {
        if (!currentData) return currentData;
        const newData = [...currentData];
        if (newData.length > 0) {
          if (!newComment.parentId) {
            newData[0].data = [newComment, ...newData[0].data];
          } else {
            for (const page of newData) {
              const parent = page.data.find((c: any) => c.id === newComment.parentId);
              if (parent) {
                parent.replies = [...(parent.replies || []), newComment];
                break;
              }
            }
          }
        }
        return newData;
      }, false);
    };

    const onCommentDeleted = () => {
      mutate();
    };

    socket.on('issue:comment_added', onNewComment);
    socket.on('issue:comment_deleted', onCommentDeleted);

    return () => {
      socket.emit('leaveIssueRoom', issueId);
      socket.off('issue:comment_added', onNewComment);
      socket.off('issue:comment_deleted', onCommentDeleted);
    };
  }, [issueId, socket, mutate]);

  const handleSubmit = async () => {
    if (!newText.trim()) return;
    setIsSubmitting(true);

    // Optimistic UI update (mock the response)
    const tempId = `temp_${Date.now()}`;
    const optimisticComment: CommentType = {
      id: tempId,
      text: newText,
      userId: currentUserId,
      parentId: null,
      isSystem: false,
      createdAt: new Date().toISOString(),
      deletedAt: null,
      user: { name: 'You', avatarUrl: null, role: 'CITIZEN' },
    };

    mutate(async (currentData: any) => {
      if (!currentData) return currentData;
      const newData = [...currentData];
      if (newData.length > 0) {
        newData[0].data = [optimisticComment, ...newData[0].data];
      }
      return newData;
    }, false);

    setNewText('');

    try {
      const res = await fetch(`http://localhost:4000/api/v1/issues/${issueId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: optimisticComment.text, userId: currentUserId }),
      });
      if (!res.ok) throw new Error('Failed to post');
      // Server will emit socket event which will override optimistic update anyway
    } catch (err) {
      console.error(err);
      alert('Failed to post comment. Reverting.');
      mutate(); // Revert
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (text: string, parentId: string) => {
    try {
      await fetch(`http://localhost:4000/api/v1/issues/${issueId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userId: currentUserId, parentId }),
      });
    } catch (err) {
      console.error(err);
      alert('Failed to post reply.');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">Discussion</h3>
        <span className="text-xs font-medium text-slate-500 bg-white px-2.5 py-1 rounded-full shadow-sm">
          {comments.length} comments
        </span>
      </div>

      {/* Input Box */}
      <div className="p-5 border-b border-slate-100 flex flex-col items-end gap-3 bg-white">
        <textarea
          className="w-full border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-sm p-3 min-h-[100px]"
          placeholder="Leave a comment... (Markdown supported)"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
        <button
          disabled={isSubmitting || !newText.trim()}
          onClick={handleSubmit}
          className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-md disabled:opacity-50 disabled:shadow-none"
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </button>
      </div>

      {/* Comments List */}
      <div className="p-6">
        {error ? (
          <div className="text-center text-red-500 p-4">Failed to load comments</div>
        ) : !data ? (
          <div className="text-center text-slate-400 p-4">Loading discussion...</div>
        ) : comments.length === 0 ? (
          <div className="text-center text-slate-400 py-10">
            No comments yet. Be the first to start the discussion!
          </div>
        ) : (
          <div className="space-y-2">
            {comments.map(comment => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                onReplySubmit={handleReplySubmit} 
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {data && data[data.length - 1]?.data?.length === 20 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setSize(size + 1)}
              disabled={isValidating}
              className="text-sm text-blue-600 font-semibold hover:text-blue-800"
            >
              {isValidating ? 'Loading...' : 'Load older comments'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
