'use client';

import React, { useState } from 'react';
import { Target, Calendar, Award, Zap, Plus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminChallengesPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAction: 'REPORT_N',
    targetCount: 5,
    rewardKarma: 100,
    startDate: '',
    endDate: ''
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/challenges/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Challenge successfully deployed!');
        setFormData({ ...formData, title: '', description: '' }); // Reset text fields
      } else {
        toast.error('Failed to deploy challenge.');
      }
    } catch (err) {
      toast.error('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen p-6 lg:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Target className="w-8 h-8 text-indigo-500" /> Challenge Creator
          </h1>
          <p className="text-slate-500 mt-1">Design and deploy monthly challenges to incentivize civic participation.</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Challenge Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Spring Cleanup Campaign"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                <textarea 
                  required
                  placeholder="Explain what citizens need to do..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <div>
                <label className="block text-sm font-bold text-indigo-900 mb-1 flex items-center gap-2">
                  <ActivityIcon className="w-4 h-4" /> Target Action
                </label>
                <select 
                  className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                  value={formData.targetAction}
                  onChange={(e) => setFormData({...formData, targetAction: e.target.value})}
                >
                  <option value="REPORT_N">Report Issues</option>
                  <option value="VERIFY_N">Verify Issues</option>
                  <option value="RESOLVE_N">Resolve Issues</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-indigo-900 mb-1">Target Count</label>
                <input 
                  type="number" min="1" required
                  className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-black text-slate-700"
                  value={formData.targetCount}
                  onChange={(e) => setFormData({...formData, targetCount: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> Reward Karma
                </label>
                <input 
                  type="number" min="0" required step="50"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 font-black text-amber-600"
                  value={formData.rewardKarma}
                  onChange={(e) => setFormData({...formData, rewardKarma: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" /> Start Date
                </label>
                <input 
                  type="date" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" /> End Date
                </label>
                <input 
                  type="date" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-200 disabled:opacity-70"
              >
                {loading ? 'Deploying...' : 'Deploy Challenge'} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const ActivityIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
