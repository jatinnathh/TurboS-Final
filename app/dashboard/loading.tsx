export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 font-sans animate-pulse">

      {/* Navbar skeleton */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 border-b border-white/5 bg-[#080c14]/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-sky-400/30" />
          <div className="w-24 h-4 bg-white/10 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 h-3 bg-white/10 rounded-lg hidden sm:block" />
          <div className="w-8 h-8 rounded-full bg-white/10" />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 space-y-10">

        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="w-56 h-8 bg-white/10 rounded-xl" />
          <div className="w-80 h-4 bg-white/[0.05] rounded-lg" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl px-5 py-4 space-y-3">
              <div className="w-16 h-2.5 bg-white/10 rounded" />
              <div className="w-10 h-8 bg-white/10 rounded-lg" />
              <div className="w-20 h-2 bg-white/[0.05] rounded" />
            </div>
          ))}
        </div>

        {/* Actions skeleton */}
        <div className="space-y-4">
          <div className="w-24 h-2.5 bg-white/10 rounded" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.07]">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="w-24 h-3 bg-white/10 rounded" />
                  <div className="w-32 h-2 bg-white/[0.05] rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-24 h-2.5 bg-white/10 rounded" />
            <div className="w-16 h-5 bg-white/[0.05] rounded-full" />
          </div>
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="hidden md:flex gap-4 px-6 py-3 bg-white/[0.03] border-b border-white/[0.06]">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex-1 h-2 bg-white/[0.06] rounded" />
              ))}
            </div>
            {/* Table rows */}
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex md:grid md:grid-cols-[2.5rem_1fr_7rem_9rem_6.5rem_7rem] gap-4 items-center px-6 py-4 border-b border-white/[0.04] last:border-b-0">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05]" />
                <div className="space-y-2 flex-1">
                  <div className="w-48 h-3 bg-white/10 rounded" />
                  <div className="w-24 h-2 bg-white/[0.05] rounded" />
                </div>
                <div className="hidden md:block w-16 h-2.5 bg-white/[0.05] rounded" />
                <div className="w-20 h-6 bg-white/[0.05] rounded-full" />
                <div className="hidden md:flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <div className="w-12 h-2.5 bg-white/[0.05] rounded" />
                </div>
                <div className="hidden md:block w-16 h-2.5 bg-white/[0.05] rounded" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}