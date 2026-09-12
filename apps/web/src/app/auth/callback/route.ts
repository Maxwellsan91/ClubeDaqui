import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const flowId = requestUrl.searchParams.get("sb_flow_id");
  const next = requestUrl.searchParams.get("next");
  const safeNext =
    next?.startsWith("/") && !next.startsWith("//") ? next : "/conta";

  const supabase = await createClient();
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined,
    );
    if (!error)
      return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
    if (!error)
      return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
  }

  return NextResponse.redirect(new URL("/auth/erro", requestUrl.origin));
}
