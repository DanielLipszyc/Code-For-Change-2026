import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { DEMO_ENABLED } from '@/lib/demo';

// Define routes that should be publicly accessible
const isPublicRoute = createRouteMatcher([
  '/',
  '/about',
  '/contact',
  '/guide',
  '/map',
  '/submit',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/submissions(.*)', // GET requests are public, POST will be protected in route handler
]);

// Local development only: the dashboard is reachable signed-out so the demo user can be used
const isDemoRoute = createRouteMatcher(['/dashboard', '/api/dashboard']);

export default clerkMiddleware(async (auth, request) => {
  if (DEMO_ENABLED && isDemoRoute(request)) {
    return;
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
