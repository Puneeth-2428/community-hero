import React from 'react';
import { AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getIssues() {
  // Using absolute URL for Server Component fetch
  const res = await fetch(`http://localhost:4000/api/v1/issues?limit=50`);
  if (!res.ok) throw new Error('Failed to fetch data');
  return res.json();
}

export default async function IssuesPage() {
  const data = await getIssues();
  const issues = data.data || [];

  return (
    <div className="bg-slate-50 min-h-screen p-6 lg:p-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8 flex items-center gap-2">
          <AlertCircle className="w-8 h-8 text-indigo-500" /> Public Issues Directory
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {issues.map((issue: any) => (
            <div key={issue.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                  issue.status === 'OPEN' ? 'bg-amber-100 text-amber-700' :
                  issue.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {issue.status}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date(issue.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-2 leading-tight line-clamp-2">
                {issue.title}
              </h2>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-500">{issue.category.replace('_', ' ')}</span>
                <span className="font-bold text-indigo-600 flex items-center gap-1">
                  ▲ {issue.upvoteCount}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
