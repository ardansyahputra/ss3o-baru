import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { isAdminRole } from "@/lib/roles";

// Route yang cuma boleh diakses ADMIN penuh (bukan LEADER/"2nd Leader")
const STRICT_ADMIN_PREFIXES = ["/staff", "/departments", "/jobdesk"];

// Route yang boleh diakses ADMIN maupun LEADER — LEADER (mis. Aldo, Ilham,
// Rizki) cuma dikasih menu Monitoring (dibatasi ke divisi tanggung jawabnya
// sendiri, lihat app/monitoring/page.js), tidak dapat Staff/Divisi/Jobdesk.
const ADMIN_OR_LEADER_PREFIXES = ["/monitoring"];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth?.token?.role;

    const isStrictAdminOnly = STRICT_ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
    const isAdminOrLeaderOnly = ADMIN_OR_LEADER_PREFIXES.some((p) => pathname.startsWith(p));

    if ((isStrictAdminOnly && role !== "ADMIN") || (isAdminOrLeaderOnly && !isAdminRole(role))) {
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
