'use client';

import React from 'react';
import { X, MapPin, ThumbsUp } from 'lucide-react';
import Link from 'next/link';

interface Issue {
  id: string;
  title: string;
  category: string;
  status: string;
  severity: string;
  latitude: number;
  longitude: number;
  upvoteCount: number;
  createdAt: string;
  media: { url: string }[];
  department: { name: string } | null;
}

interface IssueBottomSheetProps {
  issue: Issue | null;
  onClose: () => void;
}

export const IssueBottomSheet = ({ issue, onClose }: IssueBottomSheetProps) => {
  if (!issue) return null;

  const statusColors: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-800',
    VERIFIED: 'bg-purple-100 text-purple-800',
    IN_PROGRESS: 'bg-amber-100 text-amber-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-slate-100 text-slate-800',
  };

  return (
    <div className="absolute bottom-0 left-0 w-full bg-card rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[1000] transition-transform duration-300 ease-in-out transform translate-y-0">
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-12 h-1.5 bg-muted rounded-full" />
      </div>
      
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-muted-foreground hover:text-foreground bg-muted rounded-full p-1"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 max-w-5xl mx-auto">
        {/* Thumbnail */}
        {issue.media.length > 0 ? (
          <img 
            src={issue.media[0].url} 
            alt={issue.title}
            className="w-full sm:w-48 h-48 object-cover rounded-2xl shadow-sm"
          />
        ) : (
          <div className="w-full sm:w-48 h-48 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}

        {/* Details */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[issue.status] || statusColors.OPEN}`}>
              {issue.status.replace('_', ' ')}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground capitalize">
              {issue.category.replace('_', ' ').toLowerCase()}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2 leading-tight">{issue.title}</h2>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}</span>
            </div>
            {issue.department && (
              <span className="truncate">Dept: {issue.department.name}</span>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-foreground bg-muted px-3 py-1.5 rounded-lg">
              <ThumbsUp className="w-4 h-4" />
              <span className="font-semibold">{issue.upvoteCount} votes</span>
            </div>

            <Link 
              href={`/issues/${issue.id}`}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-sm transition-all hover:shadow-md"
            >
              View Full Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
