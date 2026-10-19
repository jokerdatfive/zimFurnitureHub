import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/auth/admin-auth';

/**
 * Guard for admin-only API routes. proxy.ts only protects /admin and /dashboard
 * pages, so API routes must check the admin session cookie themselves.
 * Returns a 401 response when not signed in, otherwise null.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  if (await isAuthenticatedAdmin()) return null;
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
