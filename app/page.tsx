import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8 bg-zinc-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-zinc-900 mb-2">OrganizeIt</h1>
        <p className="text-zinc-500 text-lg">
          Photograph, catalog, and sell your stuff on eBay — in seconds.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-zinc-900 px-6 py-3 text-white font-medium hover:bg-zinc-700 transition-colors"
        >
          Get started
        </Link>
        <Link
          href="/items"
          className="rounded-lg border border-zinc-300 px-6 py-3 text-zinc-700 font-medium hover:bg-zinc-100 transition-colors"
        >
          Browse catalog
        </Link>
      </div>
    </main>
  );
}
