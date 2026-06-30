'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { formatDistanceToNow } from 'date-fns';
import { Shield, Info, Reply, UserCircle2 } from 'lucide-react';

interface User {
  name: string | null;
  avatarUrl: string | null;
  role: string;
}

export interface CommentType {
  id: string;
  text: string;
  userId: string;
  parentId: string | null;
  isSystem: boolean;
  createdAt: string;
  deletedAt: string | null;
  user: User;
  replies?: CommentType[];
}

interface CommentItemProps {
  comment: CommentType;
  onReplySubmit?: (text: string, parentId: string) => Promise<void>;
  isReply?: boolean;
}

export const CommentItem = ({ comment, onReplySubmit, isReply = false }: CommentItemProps) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (comment.deletedAt) {
    return (
      <div className={`p-4 border border-slate-100 bg-slate-50 rounded-xl text-slate-400 italic text-sm ${isReply ? 'ml-8 mt-2' : 'mb-4'}`}>
        This comment was deleted.
      </div>
    );
  }

  const isModerator = comment.user.role === 'MODERATOR' || comment.user.role === 'ADMIN';

  const handleReply = async () => {
    if (!replyText.trim() || !onReplySubmit) return;
    setIsSubmitting(true);
    try {
      await onReplySubmit(replyText, comment.id);
      setIsReplying(false);
      setReplyText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`flex gap-4 ${isReply ? 'ml-8 mt-3' : 'mb-5'}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {comment.isSystem ? (
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <Info className="w-5 h-5" />
          </div>
        ) : comment.user.avatarUrl ? (
          <img src={comment.user.avatarUrl} alt={comment.user.name || 'User'} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
            <UserCircle2 className="w-6 h-6" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-slate-800 text-sm">
            {comment.isSystem ? 'System Message' : comment.user.name || 'Anonymous Citizen'}
          </span>
          <span className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
          {isModerator && !comment.isSystem && (
            <span className="flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ml-2">
              <Shield className="w-3 h-3" /> Official Update
            </span>
          )}
        </div>

        <div className={`text-sm prose prose-sm max-w-none ${comment.isSystem ? 'text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-100' : 'text-slate-700'}`}>
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
            {comment.text}
          </ReactMarkdown>
        </div>

        {/* Reply Action */}
        {!isReply && !comment.isSystem && onReplySubmit && (
          <div className="mt-2 flex items-center">
            <button 
              onClick={() => setIsReplying(!isReplying)}
              className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium transition-colors"
            >
              <Reply className="w-3 h-3" /> {isReplying ? 'Cancel' : 'Reply'}
            </button>
          </div>
        )}

        {/* Reply Input Box */}
        {isReplying && (
          <div className="mt-3 flex flex-col items-end gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <textarea
              className="w-full text-sm border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
              rows={2}
              placeholder="Write your reply... (Markdown supported)"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <button 
              disabled={isSubmitting || !replyText.trim()}
              onClick={handleReply}
              className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Posting...' : 'Post Reply'}
            </button>
          </div>
        )}

        {/* Render Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 border-l-2 border-slate-100">
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
