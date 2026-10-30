import { NextRequest, NextResponse } from "next/server";

const apiOrigin = process.env.API_INTERNAL_URL || "http://localhost:4000";

export async function middleware(request: NextRequest) {
  try {
    const response = await fetch(`${apiOrigin}/api/age/status`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store"
    });
    if (response.ok) {
      const status = await response.json() as { verified?: boolean };
      if (status.verified === true) return NextResponse.next();
    }
  } catch {
    // Fail closed: without a successful age check, app pages remain blocked.
  }

  return NextResponse.redirect(new URL("/age-check", request.url));
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|age-check).*)"]
};
