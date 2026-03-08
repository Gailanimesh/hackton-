import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // In this purely client-side authentication architecture, 
  // Supabase stores the session in localStorage. 
  // Edge Middleware cannot read localStorage, so we pass through here
  // and rely on the client-side `useAuth()` and `useSession()` hooks 
  // to guard protected routes and handle redirects.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
