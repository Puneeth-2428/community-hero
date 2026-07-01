'use client';

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { 
  AlertTriangle, CheckCircle, Clock, Heart, Download, Sparkles, AlertCircle, Building2, TrendingUp, Check
} from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
});

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const role = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;

  // Role Guard
  useEffect(() => {
    if (status !== 'loading' && role !== 'ADMIN') {
      toast.error('Unauthorized access');
      router.push('/login');
    }
  }, [status, role, router]);

  if (status === 'loading' || role !== 'ADMIN') return null;

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-screen-2xl mx-auto p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Command Center</h1>
            <p className="text-muted-foreground mt-1">Overview of civic health and operations.</p>
          </div>
          <button 
            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/admin/export?userId=${userId}`, '_blank')}
            className="flex items-center gap-2 bg-foreground text-background hover:opacity-90 px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        <AdminDashboardContent userId={userId} />
      </div>
    </div>
  );
}

function AdminDashboardContent({ userId }: { userId: string }) {
  const { data: dashboardData, isLoading: dashLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard?userId=${userId}`,
    fetcher, { refreshInterval: 60000 }
  );

  const { data: insightsData, isLoading: insightsLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/insights?userId=${userId}`,
    fetcher, { revalidateOnFocus: false }
  );

  if (dashLoading) return <div className="animate-pulse h-96 bg-muted rounded-3xl w-full"></div>;
  if (!dashboardData?.data) return <div className="text-red-500">Error loading dashboard</div>;

  const { kpis, departmentStats } = dashboardData.data;

  return (
    <div className="space-y-8">
      {/* 1. KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Open Issues" value={kpis.totalOpen} icon={<AlertTriangle className="text-red-500" />} />
        <KPICard title="Awaiting Action" value={kpis.awaitingAction} icon={<AlertCircle className="text-amber-500" />} />
        <KPICard title="Avg Response Time" value={`${kpis.avgResponseTime}d`} icon={<Clock className="text-blue-500" />} />
        <KPICard title="Citizen Satisfaction" value={`${kpis.citizenSatisfaction}%`} icon={<Heart className="text-green-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Live Feed & Heatmap */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* 5. Trend Alert Panel */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20"><Sparkles className="w-24 h-24" /></div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 relative z-10"><Sparkles className="w-5 h-5"/> AI Insights</h3>
            {insightsLoading ? (
              <div className="animate-pulse space-y-3 relative z-10">
                <div className="h-4 bg-white/20 rounded w-full"></div>
                <div className="h-4 bg-white/20 rounded w-5/6"></div>
              </div>
            ) : (
              <ul className="space-y-3 relative z-10">
                {insightsData?.data?.map((alert: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 bg-white/10 p-3 rounded-xl backdrop-blur-sm text-sm">
                    <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-200" />
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 2. Live Issue Feed */}
          <LiveIssueFeed userId={userId} />
        </div>

        {/* Right Column: Heatmap & Departments */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 3. Heatmap Placeholder */}
          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-muted-foreground" /> Ward Heatmap
            </h3>
            <div className="bg-muted w-full h-72 rounded-2xl flex items-center justify-center border-2 border-dashed border-border relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v11/static/77.5946,12.9716,11/800x400?access_token=pk.eyJ1IjoiZGVtbyIsImEiOiJja3A5MndzYmMwMDFxMndvM3Z1NnB4cWxxIn0.1_2_3')] bg-cover bg-center opacity-40 mix-blend-multiply"></div>
              <div className="relative z-10 text-center p-4">
                <p className="font-bold text-muted-foreground">Choropleth Map Active</p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">Mapbox integration loaded. Color density indicates issue volume per ward boundary.</p>
              </div>
            </div>
          </div>

          {/* 4. Department Performance Table */}
          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm overflow-hidden">
            <h3 className="text-lg font-bold text-foreground mb-6">Department Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Department</th>
                    <th className="pb-3 font-semibold text-right">Assigned</th>
                    <th className="pb-3 font-semibold text-right">Resolved</th>
                    <th className="pb-3 font-semibold text-right">Avg Days</th>
                    <th className="pb-3 font-semibold text-right">SLA Breaches</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {departmentStats.map((dept: any) => (
                    <tr key={dept.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-4 text-sm font-semibold text-foreground">{dept.name}</td>
                      <td className="py-4 text-sm text-muted-foreground text-right">{dept.assigned}</td>
                      <td className="py-4 text-sm text-muted-foreground text-right">{dept.resolved}</td>
                      <td className="py-4 text-sm font-medium text-muted-foreground text-right">{dept.avgDays}</td>
                      <td className="py-4 text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          dept.slaBreaches > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {dept.slaBreaches}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex items-center gap-5">
      <div className="p-4 bg-muted rounded-2xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
        <p className="text-3xl font-extrabold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function LiveIssueFeed({ userId }: { userId: string }) {
  const { socket } = useSocket();
  
  const { data, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/issues?status=OPEN`,
    fetcher
  );

  const [feed, setFeed] = useState<any[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    if (data?.data) {
      setFeed(data.data);
    }
  }, [data]);

  useEffect(() => {
    if (!socket) return;
    const onIssueCreated = (issue: any) => setFeed(prev => [issue, ...prev].slice(0, 50));
    socket.on('issue:created', onIssueCreated);
    return () => { socket.off('issue:created', onIssueCreated); };
  }, [socket]);

  const handleResolve = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setResolvingId(id);
    
    // Save previous state for rollback
    const previousFeed = [...feed];
    
    // Instant Optimistic UI Update before network request
    setFeed(prev => prev.filter(issue => issue.id !== id));
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/issues/${id}/resolve`, { method: 'PUT' });
      if (res.ok) {
        toast.success('Issue marked as resolved!');
        mutate(); // Re-fetch open issues in background
      } else {
        setFeed(previousFeed);
        toast.error('Failed to resolve issue on the server.');
      }
    } catch (e) {
      setFeed(previousFeed);
      toast.error('Network error. Failed to resolve issue.');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="bg-card rounded-3xl border border-border shadow-sm flex flex-col h-[500px]">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          Unresolved Issues
        </h3>
        <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">{feed.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {feed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
            <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No open issues found.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {feed.map((issue, idx) => (
              <div 
                key={issue.id || idx} 
                className="p-4 hover:bg-muted/50 rounded-2xl cursor-pointer transition-colors border border-transparent hover:border-border"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-foreground line-clamp-1">{issue.title}</span>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md flex-shrink-0">{issue.ward || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="uppercase tracking-wider font-semibold text-muted-foreground">{issue.category?.replace('_', ' ')}</span>
                  </div>
                  <button 
                    onClick={(e) => handleResolve(issue.id, e)}
                    disabled={resolvingId === issue.id}
                    className="flex items-center gap-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                  >
                    <Check className="w-3 h-3" />
                    {resolvingId === issue.id ? 'Resolving...' : 'Resolve'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
