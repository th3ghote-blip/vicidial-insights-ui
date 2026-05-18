/**
 * Skeleton shown by Next.js while the async Server Component (page.tsx) is
 * awaiting the 14 parallel API calls.  Mirrors the real dashboard shell so
 * there's no jarring layout shift on hydration.
 */

function Pulse({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-zinc-800 ${className}`} />
  );
}

function KpiCard() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-2">
      <Pulse className="h-3 w-24" />
      <Pulse className="h-7 w-16" />
      <Pulse className="h-2.5 w-20" />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-950 flex">

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-zinc-800 bg-zinc-900 px-3 py-4 gap-1">
        <Pulse className="h-8 w-32 mb-4 mx-1" />
        {Array.from({ length: 7 }).map((_, i) => (
          <Pulse key={i} className="h-9 w-full" />
        ))}
        <div className="mt-auto space-y-2">
          <Pulse className="h-8 w-full" />
          <Pulse className="h-8 w-full" />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="h-14 border-b border-zinc-800 bg-zinc-900 flex items-center px-4 gap-3">
          <Pulse className="h-8 w-8 rounded-full md:hidden" />
          <Pulse className="h-5 w-40" />
          <div className="ml-auto flex gap-2">
            <Pulse className="h-8 w-28 rounded-lg" />
            <Pulse className="h-8 w-8 rounded-lg" />
            <Pulse className="h-8 w-8 rounded-lg" />
          </div>
        </header>

        {/* KPI strip */}
        <div className="px-4 pt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <KpiCard key={i} />)}
        </div>

        {/* AI banner */}
        <div className="px-4 pt-3">
          <Pulse className="h-14 w-full rounded-xl" />
        </div>

        {/* Content area */}
        <div className="flex-1 px-4 pt-4 pb-6 grid lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <Pulse className="h-64 w-full rounded-xl" />
            <Pulse className="h-48 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Pulse className="h-48 w-full rounded-xl" />
            <Pulse className="h-64 w-full rounded-xl" />
          </div>
        </div>

      </div>
    </div>
  );
}
