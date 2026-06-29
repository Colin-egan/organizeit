import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeleteItemButton from "@/components/DeleteItemButton";

const statusConfig: Record<string, { dot: string; badge: string }> = {
  Listed:   { dot: "bg-indigo-500",  badge: "text-indigo-700 bg-indigo-50 border-indigo-100"  },
  Sold:     { dot: "bg-emerald-500", badge: "text-emerald-700 bg-emerald-50 border-emerald-100" },
  Unlisted: { dot: "bg-stone-400",   badge: "text-stone-600 bg-stone-100 border-stone-200"    },
};

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: item } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!item) notFound();

  const aspects = item.aspects as Record<string, string> | null;
  const statusCfg = statusConfig[item.status] ?? statusConfig["Unlisted"];

  const aspectFields = [
    { label: "Brand",    value: aspects?.brand    },
    { label: "Model",    value: aspects?.model    },
    { label: "Color",    value: aspects?.color    },
    { label: "Material", value: aspects?.material },
    { label: "Size",     value: aspects?.size     },
  ].filter((a) => a.value);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href="/items"
        className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 mb-6 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Catalog
      </Link>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        {/* Photo hero */}
        {item.photo_url && (
          <div className="relative h-80 w-full bg-stone-100">
            <Image
              src={item.photo_url}
              alt={item.name}
              fill
              className="object-contain"
              priority
            />
          </div>
        )}

        <div className="p-6">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-1">
            <h1 className="text-xl font-bold text-stone-900 tracking-tight leading-tight">
              {item.name}
            </h1>
            <span
              className={`shrink-0 mt-0.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusCfg.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {item.status}
            </span>
          </div>

          {item.location && (
            <p className="flex items-center gap-1.5 text-sm text-stone-400 mb-5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1C4.343 1 3 2.343 3 4c0 2.25 3 7 3 7s3-4.75 3-7c0-1.657-1.343-3-3-3Z" stroke="currentColor" strokeWidth="1.25"/>
                <circle cx="6" cy="4" r="1.25" fill="currentColor"/>
              </svg>
              {item.location}
            </p>
          )}

          {item.description && (
            <p className="text-sm text-stone-600 leading-relaxed mb-5">{item.description}</p>
          )}

          {/* Key details grid */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {item.condition && (
              <InfoTile label="Condition" value={item.condition} />
            )}
            {item.category && (
              <InfoTile label="Category" value={item.category} />
            )}
            {item.estimated_value && (
              <InfoTile
                label="Est. Value"
                value={`$${Number(item.estimated_value).toFixed(2)}`}
                valueClass="text-emerald-600 font-bold tabular-nums"
              />
            )}
          </div>

          {/* eBay aspects */}
          {aspectFields.length > 0 && (
            <div className="rounded-xl border border-stone-100 bg-stone-50 p-4 mb-5">
              <p className="text-[11px] font-medium uppercase tracking-widest text-stone-400 mb-3">
                eBay Details
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {aspectFields.map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-stone-400">{label}</span>
                    <span className="font-medium text-stone-700">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5">
            {item.status !== "Listed" && (
              <button className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 active:scale-[0.97] transition-all shadow-sm shadow-indigo-900/20">
                Post to eBay
              </button>
            )}
            {item.ebay_listing_url && (
              <a
                href={item.ebay_listing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 active:scale-[0.97] transition-all text-center"
              >
                View on eBay ↗
              </a>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-stone-100">
            <DeleteItemButton itemId={item.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTile({
  label,
  value,
  valueClass = "text-stone-800 font-semibold",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-stone-100 bg-stone-50 p-3 text-center">
      <p className="text-[11px] uppercase tracking-widest text-stone-400 mb-1">{label}</p>
      <p className={`text-sm ${valueClass}`}>{value}</p>
    </div>
  );
}
