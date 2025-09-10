import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

// Fall back to a no-op middleware if Clerk keys are not configured
const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !!process.env.CLERK_SECRET_KEY;

// Robust wrapper to avoid 500s on misconfiguration
export default function middleware(req: NextRequest) {
  if (process.env.DISABLE_CLERK_MIDDLEWARE === '1') return NextResponse.next();
  if (!hasClerk) return NextResponse.next();
  try {
    const handler = clerkMiddleware({
      // Keep common pages public; API handlers enforce auth explicitly
      publicRoutes: [
        "/",
        "/stream",
        "/tutorials(.*)",
        "/frontend(.*)",
        "/api/setup",
      ],
    }) as unknown as (req: NextRequest) => Response | Promise<Response>;
    return handler(req);
  } catch {
    // Never take down the site from middleware
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Run on all paths except static assets and _next
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
