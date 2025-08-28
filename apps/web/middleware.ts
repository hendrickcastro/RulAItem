import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Public paths that don't require authentication
    const publicPaths = [
      '/',
      '/auth/signin',
      '/auth/signout',
      '/auth/error',
      '/api/auth',
    ];

    // Check if the path is public
    if (publicPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    // API routes that require authentication
    if (pathname.startsWith('/api/')) {
      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      return NextResponse.next();
    }

    // Dashboard routes require authentication
    if (pathname.startsWith('/dashboard')) {
      if (!token) {
        const url = new URL('/auth/signin', req.url);
        url.searchParams.set('callbackUrl', req.url);
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // This callback is only called for paths specified in the matcher
        // Return true to allow the request, false to redirect to sign-in
        const { pathname } = req.nextUrl;
        
        // Allow public paths
        if (pathname === '/' || pathname.startsWith('/auth/')) {
          return true;
        }

        // Require authentication for protected paths
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};