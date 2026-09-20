import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/register(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/services(.*)",
  "/about(.*)",
  "/contact(.*)",
  "/staff/login(.*)",
  "/api/webhook(.*)",
]);

const isStaffRoute = createRouteMatcher([
  "/staff/dashboard(.*)",
  "/staff/patients(.*)",
  "/staff/appointments(.*)",
  "/staff/documents(.*)",
  "/staff/billing(.*)",
]);

export default clerkMiddleware((auth, request) => {
  // Staff routes use custom JWT — skip Clerk protection
  if (isStaffRoute(request)) {
    return NextResponse.next();
  }

  // Public routes — no auth needed
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // Everything else — protect with Clerk
  auth.protect();
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};