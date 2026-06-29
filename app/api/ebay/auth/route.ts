import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEbayAuthUrl } from "@/lib/ebay";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  try {
    const url = getEbayAuthUrl();
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(`${origin}/settings/ebay?error=not_configured`);
  }
}
