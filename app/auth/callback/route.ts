import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const flow = request.nextUrl.searchParams.get("flow");
  if (!code) return NextResponse.redirect(new URL("/auth/error", request.url));

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/auth/error", request.url));

  const destination = new URL("/auth/verified", request.url);
  if (flow) destination.searchParams.set("flow", flow);
  return NextResponse.redirect(destination);
}
