import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isPublicRequest } from "@/lib/routeAccess";

/**
 * Everything requires sign-in unless lib/routeAccess.ts lists it as public.
 * Signed-out page visits go to sign-in; signed-out API calls get a JSON 401.
 * Every API handler checks the user again, so this is only the first layer.
 */
export default clerkMiddleware(async (auth, request) => {
  if (isPublicRequest(request.method, request.nextUrl.pathname)) return;

  if (request.nextUrl.pathname.startsWith("/api/")) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
    }
    return;
  }

  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/api/(.*)",
  ],
};
