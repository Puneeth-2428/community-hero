'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Trophy, ArrowUpCircle, ArrowDownCircle, Minus, MapPin, Building2, Globe2, Sparkles } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const MOCK_USER_ID = 'citizen-1'; // Mock logged in user

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all_time'>('all_time');
  const [scope, setScope] = useState<'ward' | 'city' | 'all_india'>('all_india');
  
  const { data, mutate, isLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/leaderboard?timeframe=${timeframe}&scope=${scope}&userId=${MOCK_USER_ID}`,
    fetcher
  );

  const { socket } = useSocket();

  // Listen for real-time karma updates to animate ranks
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => mutate(); // Re-fetch leaderboard on any karma event
    socket.on('leaderboard:update', handleUpdate);
    return () => { socket.off('leaderboard:update', handleUpdate); };
  }, [socket, mutate]);

  const users = data?.data || [];

  return (
    <div className="bg-slate-50 min-h-screen p-6 lg:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 mb-4 flex items-center justify-center gap-3">
            <Trophy className="w-10 h-10 text-amber-500 fill-amber-500" />
            Civic Leaderboard
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto">Track the most impactful citizens in your community. Earn karma by reporting and verifying civic issues.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-200 mb-8 gap-4">
          <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
            {[
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'all_time', label: 'All Time' }
            ].map(t => (
              <button 
                key={t.id} onClick={() => setTimeframe(t.id as any)}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${timeframe === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
            {[
              { id: 'ward', label: 'My Ward', icon: <MapPin className="w-4 h-4" /> },
              { id: 'city', label: 'My City', icon: <Building2 className="w-4 h-4" /> },
              { id: 'all_india', label: 'All India', icon: <Globe2 className="w-4 h-4" /> }
            ].map(s => (
              <button 
                key={s.id} onClick={() => setScope(s.id as any)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${scope === s.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {s.icon} <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider w-24 text-center">Rank</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Citizen</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Karma</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Impact</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Badges</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-20 text-center"><div className="animate-pulse flex flex-col items-center"><div className="h-4 w-48 bg-slate-200 rounded mb-4"></div><div className="h-4 w-32 bg-slate-200 rounded"></div></div></td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-medium">No citizens found in this scope.</td></tr>
                ) : (
                  users.map((user: any) => (
                    <tr key={user.id} className={`transition-colors hover:bg-slate-50 ${user.isCurrentUser ? 'bg-amber-50/50 hover:bg-amber-50' : ''}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`text-lg font-black ${user.rank === 1 ? 'text-amber-500' : user.rank === 2 ? 'text-slate-400' : user.rank === 3 ? 'text-orange-400' : 'text-slate-500'}`}>
                            #{user.rank}
                          </span>
                          {/* Animated arrow mock - real logic requires historical rank tracking */}
                          {user.rank <= 3 ? <ArrowUpCircle className="w-4 h-4 text-green-500" /> : <Minus className="w-4 h-4 text-slate-300" />}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden">
                            {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : null}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 flex items-center gap-2">
                              {user.name} {user.isCurrentUser && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span className="font-black text-slate-800 text-lg">{user.karma.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-slate-600"><span className="text-blue-500">{user.issuesReported}</span> rep</span>
                          <span className="text-xs font-bold text-slate-600"><span className="text-green-500">{user.issuesResolved}</span> res</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm">
                          {user.badgesCount}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
