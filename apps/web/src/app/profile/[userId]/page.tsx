'use client';

import React from 'react';
import useSWR from 'swr';
import { Award, Zap, Activity, Clock, Shield, CheckCircle2, ChevronRight, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const fetcher = (url: string) => fetch(url).then(res => {
  if(!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
});

export default function ProfilePage({ params }: { params: { userId: string } }) {
  const { data, isLoading, error } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/profile/${params.userId}`,
    fetcher
  );

  if (isLoading) return <ProfileSkeleton />;
  if (error || !data?.data) return <div className="p-10 text-red-500">Failed to load profile.</div>;

  const { user, stats, badges, karmaHistory } = data.data;

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* 1. Header & Karma Score */}
      <div className="bg-slate-900 pt-20 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10"><Zap className="w-64 h-64 text-amber-400" /></div>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xl">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-16 h-16 text-slate-500" />
            )}
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">{user.name}</h1>
            <p className="text-slate-400 mt-1 font-medium tracking-wide flex items-center justify-center md:justify-start gap-2">
              <Shield className="w-4 h-4" /> {user.role} • Joined {new Date(user.joinedAt).toLocaleDateString()}
            </p>
            <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4">
              <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl flex items-center gap-3">
                <Zap className="w-6 h-6 text-amber-400 fill-amber-400" />
                <div className="text-left">
                  <p className="text-xs text-slate-300 font-bold uppercase tracking-wider">Total Karma</p>
                  <p className="text-2xl font-black text-white">{user.karma.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl flex items-center gap-3">
                <Activity className="w-6 h-6 text-blue-400" />
                <div className="text-left">
                  <p className="text-xs text-slate-300 font-bold uppercase tracking-wider">Issues</p>
                  <p className="text-2xl font-black text-white">{stats.issuesReported}</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
                <div className="text-left">
                  <p className="text-xs text-slate-300 font-bold uppercase tracking-wider">Verified</p>
                  <p className="text-2xl font-black text-white">{stats.issuesVerified}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. Badge Cabinet */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-purple-500" /> Badge Collection
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {badges.map((badge: any) => (
                <div 
                  key={badge.id} 
                  className={`flex flex-col items-center text-center p-4 rounded-2xl transition-all ${
                    badge.earned ? 'bg-purple-50 border border-purple-100 shadow-sm' : 'bg-slate-50 opacity-60 grayscale'
                  }`}
                >
                  <div className={`w-16 h-16 mb-3 rounded-full flex items-center justify-center ${badge.earned ? 'bg-white shadow-md' : 'bg-slate-200'}`}>
                    {/* Fallback to emoji based on internalKey since iconUrl might be broken */}
                    <span className="text-3xl">
                      {badge.internalKey === 'FIRST_RESPONDER' ? '🚑' :
                       badge.internalKey === 'NEIGHBORHOOD_WATCH' ? '👁️' :
                       badge.internalKey === 'PROBLEM_SOLVER' ? '✅' :
                       badge.internalKey === 'MEGA_IMPACT' ? '💥' :
                       badge.internalKey === 'WARD_CHAMPION' ? '🏆' :
                       badge.internalKey === 'STREAK_GUARDIAN' ? '🔥' : '🏅'}
                    </span>
                  </div>
                  <h3 className={`font-bold text-sm ${badge.earned ? 'text-purple-900' : 'text-slate-500'}`}>{badge.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-tight">{badge.description}</p>
                  {badge.earned && (
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full mt-2">
                      Earned {new Date(badge.awardedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Karma History Feed */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 h-full">
            <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" /> Karma History
            </h2>
            <div className="space-y-4">
              {karmaHistory.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-10">No karma events yet.</p>
              ) : (
                <div className="relative border-l-2 border-slate-100 pl-4 space-y-6 ml-2">
                  {karmaHistory.map((history: any) => (
                    <div key={history.id} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white shadow-sm"></div>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{formatActionType(history.actionType)}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{formatDistanceToNow(new Date(history.createdAt))} ago</p>
                        </div>
                        <span className="font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg text-sm">
                          +{history.points}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function formatActionType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function ProfileSkeleton() {
  return (
    <div className="bg-slate-50 min-h-screen animate-pulse">
      <div className="bg-slate-900 pt-20 pb-24 px-6 h-72">
        <div className="max-w-4xl mx-auto flex gap-8">
          <div className="w-32 h-32 rounded-full bg-slate-800"></div>
          <div className="flex-1 space-y-4 pt-4">
            <div className="h-8 bg-slate-800 rounded-lg w-1/3"></div>
            <div className="h-4 bg-slate-800 rounded-lg w-1/4"></div>
            <div className="flex gap-4 mt-6">
              <div className="h-16 bg-slate-800 rounded-2xl w-32"></div>
              <div className="h-16 bg-slate-800 rounded-2xl w-32"></div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 -mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-20">
        <div className="lg:col-span-2 h-96 bg-white rounded-3xl border border-slate-200"></div>
        <div className="lg:col-span-1 h-96 bg-white rounded-3xl border border-slate-200"></div>
      </div>
    </div>
  );
}
