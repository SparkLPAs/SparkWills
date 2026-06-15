export { default } from "next-auth/middleware";

// Protect authenticated areas; unauthenticated users are redirected to /login.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/account/:path*",
    "/admin/:path*",
  ],
};
