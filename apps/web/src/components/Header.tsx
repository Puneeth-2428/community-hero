'use client';

import React from 'react';
import Link from 'next/link';
import { NotificationBadge } from './NotificationBadge';
import { useSession, signOut } from 'next-auth/react';
import { ThemeToggle } from './ThemeToggle';

export const Header = () => {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6 max-w-7xl mx-auto">
        <Link href="/" className="font-extrabold text-xl tracking-tight text-foreground">
          Community<span className="text-blue-600 dark:text-blue-500">Hero</span>
        </Link>

        <div className="flex items-center gap-4">
          {session && (
            <Link 
              href={(session?.user as any)?.role === 'ADMIN' ? "/admin/dashboard" : "/dashboard"} 
              className="text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              Home
            </Link>
          )}
          <Link href="/map" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            Map
          </Link>
          <Link href="/settings/notifications" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            Settings
          </Link>
          {session ? (
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm font-semibold text-destructive hover:text-destructive/80"
            >
              Log Out
            </button>
          ) : (
            <Link href="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400">
              Log In
            </Link>
          )}
          <NotificationBadge userId={(session?.user as any)?.id || "citizen-1"} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
