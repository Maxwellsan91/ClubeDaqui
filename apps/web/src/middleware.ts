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
    request.nextUrl.pathname.startsWith("/ofertas");
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  if (!user && (isPartnerRoute || isMemberRoute || isAdminRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  if (user && isPartnerRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "PARTNER") {
      const url = request.nextUrl.clone();
      url.pathname = "/conta";
      url.search = "";
      url.searchParams.set("access", "denied");
      return NextResponse.redirect(url);
    }
  }
  if (user && isMemberRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    // Admins and partners use their own areas and do not need a membership.
    if (profile?.role === "MEMBER") {
      const { data: membership } = await supabase
        .from("memberships")
        .select("id")
        .eq("profile_id", user.id)
        .eq("status", "active")
        .gt("ends_at", new Date().toISOString())
        .maybeSingle();

      if (!membership) {
        const url = request.nextUrl.clone();
        url.pathname = "/clube";
        url.search = "";
        url.searchParams.set("required", "membership");
        url.searchParams.set(
          "redirectTo",
          `${request.nextUrl.pathname}${request.nextUrl.search}`,
        );
        return NextResponse.redirect(url);
      }
    }
  }
  return response;
}

export const config = {
  matcher: [
  "/conta/:path*",
  "/ofertas/:path*",
    "/parceiros/validar/:path*",
    "/parceiros/dashboard/:path*",
    "/admin/:path*",
  ],
};
