import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'super-secret-nextauth-key' });
  const { pathname } = req.nextUrl;

  // Protect Orchestrator Routes
  if (pathname.startsWith('/orchestrator') && pathname !== '/orchestrator/login') {
    if (!token) {
      return NextResponse.redirect(new URL('/orchestrator/login', req.url));
    }
    if (token.role !== 'ORCHESTRATOR') {
      return NextResponse.redirect(new URL('/login', req.url)); // Kick them to standard login
    }
  }

  // Protect Admin Routes
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (token.role !== 'ADMIN' && token.role !== 'ORCHESTRATOR') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Protect Dashboard & Report (Citizen Routes)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/report')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (token.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
    if (token.role === 'ORCHESTRATOR') {
      return NextResponse.redirect(new URL('/orchestrator/dashboard', req.url));
    }
  }

  // Redirect root to login or appropriate dashboard
  if (pathname === '/') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (token.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
    if (token.role === 'ORCHESTRATOR') {
      return NextResponse.redirect(new URL('/orchestrator/dashboard', req.url));
    }
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*', '/dashboard/:path*', '/report/:path*'],
};
