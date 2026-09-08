import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Route yang hanya boleh diakses ADMIN / LEADER
const ADMIN_ONLY_PREFIXES = [
  "/staff",
  "/departments",
  "/jobdesk",
  "/monitoring"
];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth?.token?.role;

    const isAdminOnly = ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

    if (isAdminOnly && role !== "ADMIN") {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
    pages: {
      signIn: "/login"
    }
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/staff/:path*",
    "/departments/:path*",
    "/jobdesk/:path*",
    "/my-jobdesk/:path*",
    "/daily-progress/:path*",
    "/reports/:path*",
    "/uploads/:path*",
    "/monitoring/:path*",
    "/profile/:path*",
    "/settings/:path*"
  ]
};
