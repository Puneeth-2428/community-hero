'use client';

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Bell, Mail, Smartphone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// In a real app, this comes from Auth context
const MOCK_USER_ID = 'citizen-1';
const PUBLIC_VAPID_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

// Base event types mapping from NotificationType enum
const EVENT_TYPES = [
  { id: 'ISSUE_STATUS_CHANGED', label: 'Issue Status Updates', desc: 'When an issue you reported or voted on changes status.' },
  { id: 'ISSUE_COMMENTED', label: 'New Comments', desc: 'When someone comments on your issue.' },
  { id: 'SYSTEM_ANNOUNCEMENT', label: 'System Announcements', desc: 'Official updates and verifications in your ward.' }
];

// Helper to convert VAPID key to Uint8Array required by pushManager
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export default function NotificationsSettingsPage() {
  const { data, mutate } = useSWR(`${process.env.NEXT_PUBLIC_API_URL}/notifications/preferences?userId=${MOCK_USER_ID}`, fetcher);
  const [preferences, setPreferences] = useState<Record<string, any>>({});
  const [isPushEnabled, setIsPushEnabled] = useState(false);

  useEffect(() => {
    if (data?.data) {
      const prefsMap: Record<string, any> = {};
      data.data.forEach((p: any) => {
        prefsMap[p.type] = p;
      });
      setPreferences(prefsMap);
    }
  }, [data]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setIsPushEnabled(true);
    }
  }, []);

  const handleToggle = async (type: string, channel: 'inApp' | 'email' | 'push', currentValue: boolean) => {
    const newValue = !currentValue;

    // Optimistic update
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        type,
        userId: MOCK_USER_ID,
        [channel]: newValue
      }
    }));

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: MOCK_USER_ID,
          type,
          inApp: preferences[type]?.inApp ?? true,
          email: preferences[type]?.email ?? true,
          push: preferences[type]?.push ?? false,
          [channel]: newValue
        })
      });
      toast.success('Preferences updated');
      mutate();
    } catch (err) {
      toast.error('Failed to update preference');
      mutate(); // revert
    }
  };

  const enablePushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('Push notifications are not supported in this browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Permission denied for push notifications.');
        return;
      }

      await navigator.serviceWorker.register('/sw.js');
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });

      // Save to backend
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: MOCK_USER_ID,
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('p256dh') as ArrayBuffer)))),
            auth: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('auth') as ArrayBuffer))))
          }
        })
      });

      setIsPushEnabled(true);
      toast.success('Push notifications enabled!');

    } catch (err) {
      console.error(err);
      toast.error('Failed to enable push notifications.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-10">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">Notification Preferences</h1>
        <p className="text-muted-foreground text-lg">Control how and when Community Hero contacts you.</p>
      </div>

      {!isPushEnabled && (
        <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full text-blue-600 dark:text-blue-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Enable Push Notifications</h3>
              <p className="text-muted-foreground text-sm mt-1">Get instant alerts on your device even when you're not using the app.</p>
            </div>
          </div>
          <button 
            onClick={enablePushNotifications}
            className="whitespace-nowrap px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-sm"
          >
            Enable Now
          </button>
        </div>
      )}

      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted border-b border-border">
              <th className="p-5 font-semibold text-muted-foreground w-1/2">Event Type</th>
              <th className="p-5 font-semibold text-muted-foreground text-center"><Bell className="w-5 h-5 mx-auto mb-1 text-muted-foreground"/> In-App</th>
              <th className="p-5 font-semibold text-muted-foreground text-center"><Mail className="w-5 h-5 mx-auto mb-1 text-muted-foreground"/> Email</th>
              <th className="p-5 font-semibold text-muted-foreground text-center"><Smartphone className="w-5 h-5 mx-auto mb-1 text-muted-foreground"/> Push</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {EVENT_TYPES.map((event) => {
              const pref = preferences[event.id] || { inApp: true, email: true, push: false };
              return (
                <tr key={event.id} className="hover:bg-muted/50 transition-colors">
                  <td className="p-5">
                    <p className="font-semibold text-foreground">{event.label}</p>
                    <p className="text-sm text-muted-foreground mt-1">{event.desc}</p>
                  </td>
                  <td className="p-5 text-center align-middle">
                    <Toggle checked={pref.inApp} onChange={() => handleToggle(event.id, 'inApp', pref.inApp)} />
                  </td>
                  <td className="p-5 text-center align-middle">
                    <Toggle checked={pref.email} onChange={() => handleToggle(event.id, 'email', pref.email)} />
                  </td>
                  <td className="p-5 text-center align-middle">
                    <Toggle 
                      checked={pref.push} 
                      disabled={!isPushEnabled}
                      onChange={() => handleToggle(event.id, 'push', pref.push)} 
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Simple internal Toggle component
const Toggle = ({ checked, onChange, disabled = false }: { checked: boolean, onChange: () => void, disabled?: boolean }) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        disabled ? 'opacity-50 cursor-not-allowed bg-muted' : checked ? 'bg-blue-600' : 'bg-muted'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
};
