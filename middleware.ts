import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, serializeCookieHeader, parseCookieHeader } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname === "/login" || pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  // Protected routes
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get("cookie") ?? "");
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_superadmin, is_matrix_admin")
    .eq("id", session.user.id)
    .single();

  const isAdmin = profile?.is_superadmin || profile?.is_matrix_admin;

  if (!isAdmin) {
    const unauthorizedUrl = new URL("/unauthorized", request.url);
    return NextResponse.redirect(unauthorizedUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
