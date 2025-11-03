import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const protectedRoutes = ['/dashboard', '/customer', '/admin'];
const publicRoutes = ['/sign-in', '/sign-up', '/reset-password'];

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    
    // Handle agent route redirect (agent system was removed)
    if (pathname.startsWith('/agent')) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/customer';
      return NextResponse.redirect(redirectUrl);
    }

    // Skip middleware for public routes
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // Check if environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables in middleware');
      return NextResponse.next();
    }

    // Create a response object that we can modify
    const response = NextResponse.next();
    
    // Check if this is a payment success request and add cache clearing headers
    const isPaymentSuccess = request.nextUrl.searchParams.get('payment') === 'success';
    if (isPaymentSuccess) {
      console.log('💰 Payment success detected in middleware, adding cache clearing headers');
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('Surrogate-Control', 'no-store');
    }

    // Create a Supabase client configured to use cookies
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options?: { path?: string; domain?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: string }) {
            request.cookies.set({ name, value, ...options });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options?: { path?: string; domain?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: string }) {
            request.cookies.set({ name, value: '', ...options });
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Check if the current route is protected
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    if (isProtectedRoute) {
      try {
        // Get the user's session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // If there's an error or no session and the user is trying to access a protected route
        if (error || !session) {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = '/sign-in';
          redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
          return NextResponse.redirect(redirectUrl);
        }
      } catch (authError) {
        console.error('Auth error in middleware:', authError);
        // If auth fails, redirect to sign-in
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/sign-in';
        return NextResponse.redirect(redirectUrl);
      }
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    // If middleware fails completely, just continue without authentication
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
