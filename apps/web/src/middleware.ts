import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://missing.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      "missing-publishable-key",
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          ),
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isPartnerRoute =
    request.nextUrl.pathname.startsWith("/parceiros/validar") ||
    request.nextUrl.pathname.startsWith("/parceiros/dashboard");
  const isMemberRoute =
    request.nextUrl.pathname.startsWith("/conta") ||
    request.nextUrl.pathname.startsWith("/explorar") ||
    request.nextUrl.pathname.startsWith("/admin");

  if (!user && (isPartnerRoute || isMemberRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: [
    "/conta/:path*",
    "/explorar/:path*",
    "/parceiros/validar/:path*",
    "/parceiros/dashboard/:path*",
    "/admin/:path*",
  ],
};
