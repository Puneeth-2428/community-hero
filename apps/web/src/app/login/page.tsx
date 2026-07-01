'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Loader2, ArrowRight, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'CITIZEN' | 'ADMIN'>('CITIZEN');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!isLogin) {
        // Register Flow
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, role }),
        });

        const data = await res.json();
        if (!data.success) {
          toast.error(data.message || 'Registration failed');
          setLoading(false);
          return;
        }
        
        toast.success('Account created successfully! Logging you in...');
      }

      // Login Flow (used for both direct login and post-registration)
      const res = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
        role: role,
      });

      if (res?.error) {
        if (res.error.includes('Access Denied')) {
          toast.error(res.error);
        } else {
          toast.error('Invalid email or password');
        }
      } else {
        const session = await getSession();
        toast.success('Welcome to Community Hero!');
        if ((session?.user as any)?.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-zinc-400">
            {isLogin ? 'Enter your details to sign in to your account' : 'Enter your details to join Community Hero'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => { setRole('CITIZEN'); }}
              className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                role === 'CITIZEN' 
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                  : 'bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:bg-zinc-800'
              }`}
            >
              <User className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold">Citizen</span>
            </button>
            <button
              type="button"
              onClick={() => { setRole('ADMIN'); setIsLogin(true); }}
              className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                role === 'ADMIN' 
                  ? 'bg-purple-500/20 border-purple-500 text-purple-400' 
                  : 'bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:bg-zinc-800'
              }`}
            >
              <Shield className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold">Admin</span>
            </button>
          </div>

          <AnimatePresence mode="popLayout">
            {!isLogin && role === 'CITIZEN' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required={!isLogin}
                    className="w-full pl-11 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full pl-11 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full pl-11 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          {role === 'ADMIN' ? (
            <p className="text-zinc-500 text-xs mt-4">
              Admin registration is restricted. Contact your Orchestrator.
            </p>
          ) : (
            <p className="text-zinc-400 text-sm">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setFormData({ name: '', email: '', password: '' });
                }}
                className="text-white font-medium hover:underline focus:outline-none"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
