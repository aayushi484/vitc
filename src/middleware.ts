import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Always allow public verification cards, static assets, and internal APIs
  if (
    pathname.startsWith('/card') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. Read ATS session cookie
  const sessionCookie = request.cookies.get('ats_auth_session')?.value;
  let session: any = null;

  if (sessionCookie) {
    try {
      session = JSON.parse(decodeURIComponent(sessionCookie));
      // Check expiration
      if (session?.expires_at && session.expires_at < Date.now()) {
        session = null;
      }
    } catch {
      session = null;
    }
  }

  const isAuthenticated = !!session?.user;
  const userRole = session?.user?.role;
  const userParcelId = session?.user?.parcel_id || 'CEL-KA-MANDYA-001';

  // 3. Login page redirection if already authenticated
  if (pathname === '/login') {
    if (isAuthenticated) {
      if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin/issue-card', request.url));
      }
      return NextResponse.redirect(new URL('/farmer', request.url));
    }
    return NextResponse.next();
  }

  // 4. Protect Farmer routes
  if (pathname.startsWith('/farmer')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Set parcel scope headers for SSR
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-ats-user-role', userRole || 'farmer');
    requestHeaders.set('x-ats-parcel-id', userParcelId);
    requestHeaders.set('x-ats-farmer-name', session.user.name || '');

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 5. Protect Admin routes
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (userRole !== 'admin') {
      // Non-admins redirected to farmer screen
      return NextResponse.redirect(new URL('/farmer', request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/farmer/:path*', '/admin/:path*', '/login'],
};
