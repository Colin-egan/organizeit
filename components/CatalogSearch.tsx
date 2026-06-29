"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

export default function CatalogSearch({ locations }: { locations: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-6">
      <div className="relative flex-1">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
        >
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.25"/>
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        </svg>
        <input
          type="search"
          placeholder="Search by name…"
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => update("search", e.target.value)}
          className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
        />
      </div>

      <select
        defaultValue={searchParams.get("location") ?? ""}
        onChange={(e) => update("location", e.target.value)}
        className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
      >
        <option value="">All locations</option>
        {locations.map((loc) => (
          <option key={loc} value={loc}>
            {loc}
          </option>
        ))}
      </select>

      {isPending && (
        <div className="self-center flex items-center gap-1.5 text-xs text-stone-400">
          <span className="w-3 h-3 border border-stone-300 border-t-stone-500 rounded-full animate-spin" />
          Filtering
        </div>
      )}
    </div>
  );
}
