import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next") ?? "/admin";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") && !requestedNext.includes("\\")
    ? new URL(requestedNext, origin)
    : new URL("/admin", origin);
  const safeNext = next.origin === origin ? next : new URL("/admin", origin);

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(safeNext);
      }
    } catch {
      // In case of error, redirect to login
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
