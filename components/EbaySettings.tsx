"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface Props {
  connected: boolean;
  ebayUserId: string | null;
  configured: boolean;
}

export default function EbaySettings({ connected, ebayUserId, configured }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [disconnecting, setDisconnecting] = useState(false);

  const justConnected = searchParams.get("connected") === "1";
  const errorParam = searchParams.get("error");

  async function handleDisconnect() {
    setDisconnecting(true);
    await fetch("/api/ebay/disconnect", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="max-w-lg space-y-6">
      {justConnected && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          eBay account connected successfully.
        </div>
      )}
      {errorParam && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {errorParam === "denied" && "eBay authorization was cancelled."}
          {errorParam === "exchange_failed" && "Could not exchange the authorization code. Please try again."}
          {errorParam === "not_configured" && "eBay credentials are not configured. Set EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, and EBAY_REDIRECT_URI."}
          {!["denied", "exchange_failed", "not_configured"].includes(errorParam) && "Something went wrong. Please try again."}
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
        <div className="px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">eBay Account</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Link your eBay seller account to list items directly from OrganizeIt.
          </p>
        </div>

        <div className="px-5 py-4 flex items-center justify-between gap-4">
          {connected ? (
            <>
              <div className="flex items-center gap-3">
                <span className="flex h-2.5 w-2.5 rounded-full bg-green-500" />
                <div>
                  <p className="text-sm font-medium text-zinc-800">Connected</p>
                  {ebayUserId && (
                    <p className="text-xs text-zinc-500">{ebayUserId}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                {disconnecting ? "Disconnecting…" : "Disconnect"}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="flex h-2.5 w-2.5 rounded-full bg-zinc-300" />
                <p className="text-sm text-zinc-500">Not connected</p>
              </div>
              <a
                href={configured ? "/api/ebay/auth" : undefined}
                aria-disabled={!configured}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  configured
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-zinc-100 text-zinc-400 cursor-not-allowed pointer-events-none"
                }`}
              >
                Connect eBay
              </a>
            </>
          )}
        </div>

        {!configured && (
          <div className="px-5 py-3 bg-amber-50 rounded-b-xl">
            <p className="text-xs text-amber-700">
              Set <code className="font-mono">EBAY_CLIENT_ID</code>,{" "}
              <code className="font-mono">EBAY_CLIENT_SECRET</code>, and{" "}
              <code className="font-mono">EBAY_REDIRECT_URI</code> in your{" "}
              <code className="font-mono">.env.local</code> to enable eBay linking.
            </p>
          </div>
        )}
      </div>

      {connected && (
        <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-900 mb-1">What's next?</h2>
          <p className="text-sm text-zinc-500">
            Open any item in your{" "}
            <a href="/items" className="text-blue-600 hover:underline">
              catalog
            </a>{" "}
            and click <strong>Post to eBay</strong> to create a listing.
          </p>
        </div>
      )}
    </div>
  );
}
