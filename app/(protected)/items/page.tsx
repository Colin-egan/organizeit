import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ItemsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: items } = await supabase
    .from("items")
    .select("id, name, photo_url, condition, estimated_value, location, status, category")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Catalog</h1>
        <Link
          href="/add"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          + Add item
        </Link>
      </div>

      {!items || items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-4xl mb-4">📦</p>
          <p className="text-zinc-600 font-medium mb-1">No items yet</p>
          <p className="text-zinc-400 text-sm mb-6">Take a photo to catalog your first item</p>
          <Link
            href="/add"
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            Add your first item
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/items/${item.id}`}
              className="group rounded-2xl border border-zinc-200 bg-white overflow-hidden hover:border-zinc-300 hover:shadow-sm transition-all"
            >
              <div className="relative h-40 bg-zinc-100">
                {item.photo_url ? (
                  <Image
                    src={item.photo_url}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-300 text-3xl">
                    📷
                  </div>
                )}
                <span className="absolute top-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white">
                  {item.status}
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-zinc-900 truncate">{item.name}</p>
                {item.location && (
                  <p className="text-xs text-zinc-400 truncate mt-0.5">📍 {item.location}</p>
                )}
                <div className="flex items-center justify-between mt-1.5">
                  {item.condition && (
                    <span className="text-xs text-zinc-400">{item.condition}</span>
                  )}
                  {item.estimated_value && (
                    <span className="text-xs font-medium text-zinc-700">
                      ${Number(item.estimated_value).toFixed(0)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
