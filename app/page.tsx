import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-950 text-white overflow-hidden">
      {/* Nav strip */}
      <div className="px-8 py-6 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-semibold tracking-tight text-white">OrganizeIt</span>
        </div>
        <Link
          href="/login"
          className="text-sm text-stone-400 hover:text-white transition-colors"
        >
          Sign in →
        </Link>
      </div>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-8 pt-16 pb-24 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: copy */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 mb-8">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400" />
            AI-powered item cataloging
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
            Know what{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              you own.
            </span>
            <br />
            Sell what you don&apos;t.
          </h1>

          <p className="text-lg text-stone-400 leading-relaxed mb-10 max-w-md">
            Photograph an item. AI identifies it instantly — name, condition,
            estimated value. One tap to list it on eBay.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 active:scale-[0.97] transition-all shadow-lg shadow-indigo-900/40"
            >
              Get started free
            </Link>
            <Link
              href="/items"
              className="rounded-xl border border-stone-700 px-6 py-3 text-sm font-semibold text-stone-300 hover:border-stone-500 hover:text-white active:scale-[0.97] transition-all"
            >
              Browse catalog
            </Link>
          </div>
        </div>

        {/* Right: decorative item cards */}
        <div className="hidden lg:block relative h-[420px]">
          <MockCard
            className="absolute top-0 right-8 w-52 rotate-3 shadow-2xl shadow-black/60"
            label="Vintage Camera"
            sublabel="Attic shelf 2"
            status="Listed"
            price="$85"
            statusColor="indigo"
            bg="bg-stone-800"
          />
          <MockCard
            className="absolute top-20 right-52 w-52 -rotate-2 shadow-2xl shadow-black/60"
            label="Levi's 501 Jeans"
            sublabel="Closet box A"
            status="Unlisted"
            price="$40"
            statusColor="stone"
            bg="bg-stone-700"
          />
          <MockCard
            className="absolute top-48 right-16 w-52 rotate-1 shadow-2xl shadow-black/60"
            label="Air Jordan 1 Retro"
            sublabel="Garage shelf 1"
            status="Sold"
            price="$220"
            statusColor="emerald"
            bg="bg-stone-800"
          />
        </div>
      </div>

      {/* Feature row */}
      <div className="border-t border-stone-800 bg-stone-900/50">
        <div className="max-w-7xl mx-auto px-8 py-16 grid sm:grid-cols-3 gap-8">
          {[
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M7 10l2.5 2.5L13 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
              title: "Catalog in seconds",
              body: "Snap a photo and AI fills in the name, brand, condition, and value. No typing.",
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ),
              title: "Know where it is",
              body: "Tag each item with a location — shelf, room, bin — and find anything instantly.",
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 14l4-4 3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="2" y="2" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              ),
              title: "List on eBay",
              body: "Connect your eBay account and post items with one tap — all details pre-filled.",
            },
          ].map((f) => (
            <div key={f.title} className="flex flex-col gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                {f.icon}
              </div>
              <h3 className="font-semibold text-white text-sm">{f.title}</h3>
              <p className="text-stone-400 text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function LogoMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="#4F46E5"/>
      <path
        d="M7 12l3.5 3.5L17 8"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const statusStyles: Record<string, string> = {
  indigo: "bg-indigo-500/20 text-indigo-300",
  emerald: "bg-emerald-500/20 text-emerald-300",
  stone: "bg-stone-600/40 text-stone-300",
};

const dotStyles: Record<string, string> = {
  indigo: "bg-indigo-400",
  emerald: "bg-emerald-400",
  stone: "bg-stone-400",
};

function MockCard({
  className,
  label,
  sublabel,
  status,
  price,
  statusColor,
  bg,
}: {
  className?: string;
  label: string;
  sublabel: string;
  status: string;
  price: string;
  statusColor: string;
  bg: string;
}) {
  return (
    <div className={`rounded-2xl overflow-hidden border border-white/10 ${className}`}>
      <div className={`h-32 ${bg} flex items-center justify-center`}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="opacity-20">
          <rect x="4" y="8" width="32" height="24" rx="3" stroke="white" strokeWidth="1.5"/>
          <circle cx="20" cy="20" r="6" stroke="white" strokeWidth="1.5"/>
        </svg>
      </div>
      <div className="bg-stone-900 px-3 py-2.5 border-t border-white/5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-medium text-white leading-tight">{label}</p>
          <span
            className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyles[statusColor]}`}
          >
            <span className={`w-1 h-1 rounded-full ${dotStyles[statusColor]}`} />
            {status}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-stone-500">{sublabel}</p>
          <p className="text-xs font-semibold text-emerald-400">{price}</p>
        </div>
      </div>
    </div>
  );
}
