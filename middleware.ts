import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoutes = createRouteMatcher(["/(.*)", "/"]);

export default clerkMiddleware((auth, req) => {
    if(isProtectedRoutes(req)) auth().protect();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};