'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Crown, Shield, UserPlus, Loader2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { signOut } from 'next-auth/react';

export default function OrchestratorDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const role = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  // Role Guard
  useEffect(() => {
    if (status !== 'loading' && role !== 'ORCHESTRATOR') {
      toast.error('Unauthorized access. Orchestrator only.');
      router.push('/orchestrator/login');
    }
  }, [status, role, router]);

  if (status === 'loading' || role !== 'ORCHESTRATOR') return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`http://localhost:4000/api/v1/orchestrator/admins?orchestratorId=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || 'Failed to provision admin');
      } else {
        toast.success(`Admin account provisioned for ${formData.email}!`);
        setFormData({ name: '', email: '', password: '' });
      }
    } catch (e) {
      toast.error('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/orchestrator/login');
  };

  return (
    <div className="bg-black min-h-screen text-white selection:bg-amber-500/30">
      
      {/* Header */}
      <header className="border-b border-zinc-900 bg-zinc-950">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-500" />
            <span className="font-bold tracking-widest uppercase text-sm">Orchestrator Console</span>
          </div>
          <button 
            onClick={handleLogout}
            className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" /> Disconnect
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Provisioning Center</h1>
          <p className="text-zinc-400">Securely create new Admin/Solver accounts to manage civic issues.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Create Admin Form */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <Shield className="w-6 h-6 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold">New Admin Account</h2>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-5 relative z-10">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="e.g. Jane Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="admin@city.gov"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Secure Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="Min 6 characters"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-5 h-5" /> Provision Admin</>}
              </button>
            </form>
          </div>

          {/* Info Card */}
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <h3 className="font-bold text-lg mb-2 text-amber-500">Security Notice</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                As the Orchestrator, you hold the keys to the entire civic management platform. 
                Accounts provisioned here are instantly granted the <span className="font-mono text-white bg-zinc-800 px-1 py-0.5 rounded">ADMIN</span> role, 
                giving them full access to the Command Center and the ability to resolve citizen issues.
              </p>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <h3 className="font-bold text-lg mb-2 text-white">Next Steps for Admins</h3>
              <ol className="list-decimal list-inside text-zinc-400 text-sm space-y-2">
                <li>Provide the credentials to the city official securely.</li>
                <li>Direct them to the main portal <span className="text-white">/login</span>.</li>
                <li>They must select the <strong>Admin (Shield)</strong> icon to authenticate.</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
