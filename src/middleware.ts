import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define routes that should be publicly accessible
const isPublicRoute = createRouteMatcher([
  '/',
  '/about',
  '/contact',
  '/guide',
  '/map',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/submissions(.*)', // GET requests are public, POST will be protected in route handler
  '/api/sightings(.*)',  // GET requests are public, POST will be protected in route handler
]);

export default clerkMiddleware(async (auth, request) => {
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
