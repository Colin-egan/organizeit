import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, storeEbayConnection } from "@/lib/ebay";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${origin}/settings/ebay?error=denied`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    await storeEbayConnection(user.id, tokens);
    return NextResponse.redirect(`${origin}/settings/ebay?connected=1`);
  } catch (err) {
    console.error("eBay callback error:", err);
    return NextResponse.redirect(`${origin}/settings/ebay?error=exchange_failed`);
  }
}
