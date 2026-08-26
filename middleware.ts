import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED_PREFIXES = ["/dashboard", "/projects", "/account", "/admin"];

// SparkLegal partner attribution (Aug 2026): a partner's referral link is
// https://sparklegal.co.uk?ref=<code>, which fans out to this site's own
// pages carrying the same ?ref= param. First-touch only — never overwrites
// an existing cookie — since a customer may click around (including back to
// a page with no ref param, or a different partner's link later) before
// actually registering, and the FIRST partner they came through should get
// the attribution, not whichever page they registered from.
const REF_COOKIE = "spark_ref";
const REF_COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

export default async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const ref = searchParams.get("ref");
  const setRefCookie = Boolean(ref) && !req.cookies.get(REF_COOKIE);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      const redirect = NextResponse.redirect(loginUrl);
      if (setRefCookie) {
        redirect.cookies.set(REF_COOKIE, ref!, { maxAge: REF_COOKIE_MAX_AGE, httpOnly: true, sameSite: "lax", path: "/" });
      }
      return redirect;
    }
  }

  const response = NextResponse.next();
  if (setRefCookie) {
    response.cookies.set(REF_COOKIE, ref!, { maxAge: REF_COOKIE_MAX_AGE, httpOnly: true, sameSite: "lax", path: "/" });
  }
  return response;
}

// Runs on every route (not just protected ones) so ?ref= is captured
// however a customer first lands, not only on pages that already require
// auth — excludes static assets/Next internals, which never carry it.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
