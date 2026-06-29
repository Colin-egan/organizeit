"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteItemButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/items?id=${itemId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/items");
      router.refresh();
    } else {
      setLoading(false);
      setConfirming(false);
      alert("Failed to delete item.");
    }
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 active:scale-[0.97] transition-all disabled:opacity-50"
        >
          {loading ? "Deleting…" : "Confirm delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 active:scale-[0.97] transition-all"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm text-stone-400 hover:text-red-600 transition-colors"
    >
      Delete item
    </button>
  );
}
