import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: item } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!item) notFound();

  const aspects = item.aspects as Record<string, string>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/items" className="text-zinc-500 hover:text-zinc-700 text-sm">
          ← Catalog
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        {item.photo_url && (
          <div className="relative h-72 w-full bg-zinc-100">
            <Image
              src={item.photo_url}
              alt={item.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl font-bold text-zinc-900">{item.name}</h1>
              {item.location && (
                <p className="text-sm text-zinc-500 mt-0.5">📍 {item.location}</p>
              )}
            </div>
            <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
              {item.status}
            </span>
          </div>

          {item.description && (
            <p className="text-sm text-zinc-600 mb-4">{item.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm mb-6">
            {item.condition && (
              <div>
                <span className="text-zinc-400">Condition</span>
                <p className="font-medium text-zinc-800">{item.condition}</p>
              </div>
            )}
            {item.estimated_value && (
              <div>
                <span className="text-zinc-400">Est. Value</span>
                <p className="font-medium text-zinc-800">
                  ${Number(item.estimated_value).toFixed(2)}
                </p>
              </div>
            )}
            {item.category && (
              <div>
                <span className="text-zinc-400">Category</span>
                <p className="font-medium text-zinc-800">{item.category}</p>
              </div>
            )}
            {aspects?.brand && (
              <div>
                <span className="text-zinc-400">Brand</span>
                <p className="font-medium text-zinc-800">{aspects.brand}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {item.status !== "Listed" && (
              <button className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                Post to eBay
              </button>
            )}
            {item.ebay_listing_url && (
              <a
                href={item.ebay_listing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 text-center transition-colors"
              >
                View on eBay ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
