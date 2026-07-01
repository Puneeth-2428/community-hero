'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
  RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import { AlertCircle, CheckCircle2, Clock, Zap, MapPin, Award } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { useSession } from 'next-auth/react';

const fetcher = (url: string) => fetch(url).then(res => res.json());
const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const userId = (session?.user as any)?.id;

  const { data, error, isLoading } = useSWR(
    userId ? `${process.env.NEXT_PUBLIC_API_URL}/dashboard/citizen?userId=${userId}` : null, 
    fetcher, 
    { keepPreviousData: true } 
  );

  const { data: challengesData } = useSWR(
    userId ? `${process.env.NEXT_PUBLIC_API_URL}/challenges?userId=${userId}` : null,
    fetcher
  );

  const [activeTab, setActiveTab] = useState('ALL');

  if (error) return <div className="p-10 text-red-500">Failed to load dashboard.</div>;

  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  const { summary, myIssues, wardHealthScore, categoryBreakdown, timeline, leaderboard } = data.data;
  const challenges = challengesData?.data || [];

  const filteredIssues = myIssues.filter((i: any) => activeTab === 'ALL' || i.status === activeTab);

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-10">
      <h1 className="text-3xl font-extrabold text-foreground mb-8">Hello, {summary.userName} 👋</h1>

      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <SummaryCard title="Total Reported" value={summary.totalReported} icon={<AlertCircle className="text-blue-500" />} />
        <SummaryCard title="Issues Resolved" value={summary.issuesResolved} icon={<CheckCircle2 className="text-green-500" />} />
        <SummaryCard title="Avg Resolution Time" value={`${summary.avgResolutionTimeDays}d`} icon={<Clock className="text-amber-500" />} />
        <SummaryCard title="Karma Points" value={summary.karmaPoints} icon={<Zap className="text-purple-500" />} />
      </div>

      {/* Monthly Challenges Widget */}
      {challenges.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 md:p-8 mb-10 shadow-lg text-white">
          <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-300" /> Active Monthly Challenges
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge: any) => (
              <div key={challenge.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 relative overflow-hidden">
                {challenge.completed && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-sm z-10">
                    <div className="bg-white text-green-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-xl">
                      <CheckCircle2 className="w-5 h-5" /> Completed!
                    </div>
                  </div>
                )}
                <h3 className="font-bold text-lg leading-tight mb-2">{challenge.title}</h3>
                <p className="text-sm text-indigo-100 mb-4">{challenge.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Progress</span>
                    <span>{challenge.progress} / {challenge.targetCount}</span>
                  </div>
                  <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-400 transition-all duration-1000" 
                      style={{ width: `${Math.min((challenge.progress / challenge.targetCount) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="pt-2 flex justify-between items-center text-xs font-bold text-amber-300">
                    <span>Reward: +{challenge.rewardKarma} Karma</span>
                    <span className="text-indigo-200">Ends {new Date(challenge.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* 2. Ward Health Score */}
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold text-foreground mb-4 w-full text-left">Ward Health Score</h3>
          <div className="h-48 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={20} data={[{ name: 'Health', value: wardHealthScore, fill: wardHealthScore > 75 ? '#10b981' : wardHealthScore > 40 ? '#f59e0b' : '#ef4444' }]} startAngle={180} endAngle={0}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center -mt-8 flex-col">
              <span className="text-4xl font-extrabold text-foreground">{wardHealthScore}</span>
              <span className="text-xs text-muted-foreground font-medium tracking-wide">/ 100</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center -mt-4">Based on resolved vs total issues.</p>
        </div>

        {/* 3. Category Breakdown */}
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm col-span-1 lg:col-span-2">
          <h3 className="text-lg font-bold text-foreground mb-4">Ward Issues by Category</h3>
          <div className="h-64 w-full">
            {categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {categoryBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value, name) => [value, String(name).replace('_', ' ')]} />
                  <Legend verticalAlign="middle" align="right" layout="vertical" formatter={(v) => v.replace('_', ' ')} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">No data available</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* 4. Timeline Graph */}
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm col-span-1 lg:col-span-2">
          <h3 className="text-lg font-bold text-foreground mb-6">Issue Timeline (Last 6 Months)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="reported" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="5 5" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Leaderboard */}
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <Award className="text-amber-500 w-5 h-5" /> Top Citizens
          </h3>
          <div className="space-y-4 flex-1">
            {leaderboard.top.map((user: any, idx: number) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-muted text-foreground' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'text-muted-foreground'}`}>
                    {idx + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{user.id === userId ? 'You' : user.name || 'Citizen'}</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-purple-600">{user.karma} pts</span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">Your current rank: <strong className="text-foreground">#{leaderboard.userRank}</strong></p>
          </div>
        </div>
      </div>

      {/* 6. My Issues Table */}
      <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-lg font-bold text-foreground">My Reports</h3>
          <div className="flex bg-muted p-1 rounded-xl">
            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                <th className="pb-3 font-semibold">Issue Title</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Upvotes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredIssues.map((issue: any) => (
                <tr key={issue.id} className="hover:bg-muted/50 transition-colors">
                  <td className="py-4 text-sm font-semibold text-foreground">{issue.title}</td>
                  <td className="py-4 text-sm text-muted-foreground">{issue.category.replace('_', ' ')}</td>
                  <td className="py-4 text-sm text-muted-foreground">{new Date(issue.createdAt).toLocaleDateString()}</td>
                  <td className="py-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      issue.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                      issue.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="py-4 text-sm font-bold text-muted-foreground">{issue.upvoteCount}</td>
                </tr>
              ))}
              {filteredIssues.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-muted-foreground text-sm">No issues found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const SummaryCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
  <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex items-center gap-4">
    <div className="p-4 bg-muted rounded-2xl">
      {icon}
    </div>
    <div>
      <p className="text-sm font-semibold text-muted-foreground mb-1">{title}</p>
      <p className="text-2xl font-extrabold text-foreground">{value}</p>
    </div>
  </div>
);

const DashboardSkeleton = () => (
  <div className="max-w-7xl mx-auto p-6 lg:p-10 animate-pulse">
    <div className="h-8 w-48 bg-muted rounded-lg mb-8"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      {[1,2,3,4].map(i => <div key={i} className="h-28 bg-card rounded-3xl border border-border"></div>)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
      <div className="h-72 bg-card rounded-3xl border border-border"></div>
      <div className="h-72 bg-card rounded-3xl border border-border lg:col-span-2"></div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
      <div className="h-96 bg-card rounded-3xl border border-border lg:col-span-2"></div>
      <div className="h-96 bg-card rounded-3xl border border-border"></div>
    </div>
  </div>
);
