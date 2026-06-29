import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import CatalogSearch from "@/components/CatalogSearch";

interface PageProps {
  searchParams: Promise<{ search?: string; location?: string }>;
}

const statusConfig: Record<string, { dot: string; text: string }> = {
  Listed:   { dot: "bg-indigo-500",  text: "text-indigo-700 bg-indigo-50"  },
  Sold:     { dot: "bg-emerald-500", text: "text-emerald-700 bg-emerald-50" },
  Unlisted: { dot: "bg-stone-400",   text: "text-stone-600 bg-stone-100"    },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig["Unlisted"];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

export default async function ItemsPage({ searchParams }: PageProps) {
  const { search, location } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let query = supabase
    .from("items")
    .select("id, name, photo_url, condition, estimated_value, location, status, category")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (search) query = query.ilike("name", `%${search}%`);
  if (location) query = query.eq("location", location);

  const { data: items } = await query;

  const { data: locRows } = await supabase
    .from("items")
    .select("location")
    .eq("user_id", user.id)
    .not("location", "is", null);

  const locations = [
    ...new Set(
      (locRows ?? []).map((r) => r.location as string).filter(Boolean)
    ),
  ].sort();

  const isFiltered = Boolean(search || location);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Catalog</h1>
          {items && items.length > 0 && (
            <p className="text-sm text-stone-400 mt-0.5">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/items/export"
            className="rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:border-stone-300 active:scale-[0.97] transition-all"
          >
            Export
          </a>
          <Link
            href="/add"
            className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 active:scale-[0.97] transition-all shadow-sm shadow-indigo-900/20"
          >
            + Add item
          </Link>
        </div>
      </div>

      {/* Search / filter */}
      <Suspense>
        <CatalogSearch locations={locations} />
      </Suspense>

      {/* Grid or empty state */}
      {!items || items.length === 0 ? (
        <EmptyState isFiltered={isFiltered} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/items/${item.id}`}
              className="group rounded-2xl border border-stone-200 bg-white overflow-hidden hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/5 hover:border-stone-300 transition-all duration-200"
            >
              {/* Photo */}
              <div className="relative h-44 bg-stone-100">
                {item.photo_url ? (
                  <Image
                    src={item.photo_url}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-stone-300">
                      <rect x="2" y="6" width="24" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="14" cy="15" r="4" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M10 6l1.5-3h5L18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <StatusBadge status={item.status ?? "Unlisted"} />
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-sm font-semibold text-stone-900 truncate leading-tight">
                  {item.name}
                </p>
                {item.location && (
                  <p className="text-xs text-stone-400 truncate mt-0.5 flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
                      <path d="M5 1C3.343 1 2 2.343 2 4c0 2.25 3 5 3 5s3-2.75 3-5c0-1.657-1.343-3-3-3Z" stroke="currentColor" strokeWidth="1"/>
                      <circle cx="5" cy="4" r="1" fill="currentColor"/>
                    </svg>
                    {item.location}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                  <span className="text-xs text-stone-400">
                    {item.condition ?? "—"}
                  </span>
                  {item.estimated_value ? (
                    <span className="text-xs font-semibold text-emerald-600 tabular-nums">
                      ${Number(item.estimated_value).toFixed(0)}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ isFiltered }: { isFiltered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      {/* Illustration */}
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-indigo-400">
          <rect x="4" y="8" width="24" height="18" rx="4" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="16" cy="17" r="5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M12 8l2-4h8l2 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {isFiltered ? (
        <>
          <p className="font-semibold text-stone-700 mb-1">No items match your search</p>
          <p className="text-sm text-stone-400">Try a different name or location</p>
        </>
      ) : (
        <>
          <p className="font-semibold text-stone-700 mb-1">Your catalog is empty</p>
          <p className="text-sm text-stone-400 mb-6">
            Take a photo to catalog your first item — AI does the rest.
          </p>
          <Link
            href="/add"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 active:scale-[0.97] transition-all shadow-md shadow-indigo-900/20"
          >
            Add your first item
          </Link>
        </>
      )}
    </div>
  );
}
