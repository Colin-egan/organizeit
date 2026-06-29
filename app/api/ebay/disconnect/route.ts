import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteEbayConnection } from "@/lib/ebay";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await deleteEbayConnection(user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("eBay disconnect error:", err);
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}
