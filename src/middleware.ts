import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

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

export default clerkMiddleware(async (auth, request) => {
  const demoCookie = request.cookies.get('demo_user')?.value === '1';
  const demoQuery = request.nextUrl.searchParams.get('demo') === '1';
  const isDemoDashboard = request.nextUrl.pathname === '/dashboard' && (demoCookie || demoQuery);
  const isDemoDashboardApi = request.nextUrl.pathname === '/api/dashboard' && (demoCookie || demoQuery);

  if (isDemoDashboard || isDemoDashboardApi) {
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
