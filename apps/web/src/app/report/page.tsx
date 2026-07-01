'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, SessionProvider } from 'next-auth/react';
import { toast } from 'sonner';
import { mutate } from 'swr';

const CATEGORIES = [
  'POTHOLE', 'STREETLIGHT', 'GARBAGE', 'WATER_SUPPLY', 
  'SEWAGE', 'ROAD_DAMAGE', 'ILLEGAL_DUMPING', 'NOISE_COMPLAINT', 
  'PUBLIC_SAFETY', 'PARK_MAINTENANCE', 'TRAFFIC_SIGNAL', 'OTHER'
];

function ReportForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [severity, setSeverity] = useState('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!lat || !lng) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Location missing</h1>
        <button onClick={() => router.push('/map')} className="text-blue-600 underline">Return to map</button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error('Title and description are required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          severity,
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          reportedById: (session?.user as any)?.id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Issue reported successfully!');
        const userId = (session?.user as any)?.id;
        if (userId) {
          mutate(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/citizen?userId=${userId}`);
        }
        router.push('/dashboard');
      } else {
        toast.error(data.error || 'Failed to report issue');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-card p-8 rounded-2xl shadow-sm border border-border">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-foreground">Report an Issue</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Location: {parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}
          </p>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-foreground">Title</label>
            <input 
              type="text" 
              className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-background text-foreground" 
              placeholder="E.g. Large pothole on Main St"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground">Description</label>
            <textarea 
              className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border min-h-[100px] bg-background text-foreground" 
              placeholder="Provide more details about the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Category</label>
              <select 
                className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-background text-foreground"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground">Severity</label>
              <select 
                className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-background text-foreground"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => router.back()}
              className="w-full flex justify-center py-2 px-4 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <ReportForm />
    </Suspense>
  );
}
