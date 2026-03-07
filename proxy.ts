import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",

  // Doctor system (JWT)
  "/doctor(.*)",
  "/admin(.*)",
  "/pharmacy(.*)",
  "/lab(.*)",

  // Doctor APIs
  "/api/doctor(.*)",
  "/api/lab(.*)",

  // Admin APIs
  "/api/admin(.*)",

  // AI APIs
  "/api/ai(.*)",

  "/api/request/flow",
  "/api/request/activity",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // If logged-in patient visits root → redirect to dashboard
  if (userId && req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protect everything except public routes
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};