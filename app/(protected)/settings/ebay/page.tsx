import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getEbayConnection } from "@/lib/ebay";
import EbaySettings from "@/components/EbaySettings";

export default async function EbaySettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const configured = !!(
    process.env.EBAY_CLIENT_ID &&
    process.env.EBAY_CLIENT_SECRET &&
    process.env.EBAY_REDIRECT_URI
  );

  const connection = configured ? await getEbayConnection(user.id) : null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">eBay Connection</h1>
      <Suspense>
        <EbaySettings
          connected={!!connection}
          ebayUserId={connection?.ebay_user_id ?? null}
          configured={configured}
        />
      </Suspense>
    </div>
  );
}
