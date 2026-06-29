"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/items", label: "Catalog" },
  { href: "/locations", label: "Locations" },
  { href: "/settings/ebay", label: "eBay" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/items" className="flex items-center gap-2 shrink-0">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <rect width="22" height="22" rx="6" fill="#4F46E5"/>
              <path
                d="M6.5 11l3 3L15.5 7.5"
                stroke="white"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-semibold text-stone-900 tracking-tight text-sm">
              OrganizeIt
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {links.map((l) => {
              const isActive = pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "text-stone-900 bg-stone-100"
                      : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/add"
            className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 active:scale-[0.97] transition-all shadow-sm shadow-indigo-900/20"
          >
            + Add item
          </Link>
          <button
            onClick={signOut}
            className="text-sm text-stone-400 hover:text-stone-700 px-2 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
