import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 font-sans overflow-hidden relative">

      {/* ── Background effects ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-sky-500/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-10 flex items-center justify-between px-8 md:px-16 py-6 border-b border-white/5">
        <div className="flex items-center gap-2.5 text-slate-100 font-bold text-lg tracking-tight">
          <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_10px_theme(colors.sky.400)] animate-pulse" />
          MediFlow
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          System Online
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-sky-400 bg-sky-400/8 ring-1 ring-sky-400/20 px-4 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          Inter-Department Workflow Automation
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-slate-100 leading-[1.05] max-w-4xl mb-6">
          Hospital Care,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
            Seamlessly Connected
          </span>
        </h1>

        {/* Subtext */}
        <p className="text-slate-500 text-base md:text-lg font-light max-w-xl leading-relaxed mb-14">
          Route patient requests across departments, track treatment timelines,
          and manage prescriptions — all in one unified platform.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-sm sm:max-w-none sm:w-auto">

          {/* Patient Login */}
          <Link href="/sign-in">
            <button className="group relative w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/30 hover:bg-sky-500/20 hover:ring-sky-400/60 hover:-translate-y-0.5 transition-all duration-200 text-sm font-semibold min-w-[200px]">
              <span className="text-xl">🏥</span>
              <div className="text-left">
                <p className="font-bold text-sky-300">Patient Portal</p>
                <p className="text-[11px] text-sky-500 font-normal">Book appointments & track requests</p>
              </div>
              <span className="ml-auto text-sky-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all">→</span>
            </button>
          </Link>

          {/* Doctor Login */}
          <Link href="/doctor/login">
            <button className="group relative w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20 hover:ring-emerald-400/60 hover:-translate-y-0.5 transition-all duration-200 text-sm font-semibold min-w-[200px]">
              <span className="text-xl">🩺</span>
              <div className="text-left">
                <p className="font-bold text-emerald-300">Doctor Portal</p>
                <p className="text-[11px] text-emerald-600 font-normal">Manage patients & prescriptions</p>
              </div>
              <span className="ml-auto text-emerald-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all">→</span>
            </button>
          </Link>

        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-14">
          {[
            { icon: "🔄", label: "Department Routing" },
            { icon: "📋", label: "Activity Timeline" },
            { icon: "💊", label: "Prescriptions" },
            { icon: "🚨", label: "Emergency Triage" },
            { icon: "🧪", label: "Lab Integration" },
          ].map((f) => (
            <span
              key={f.label}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-white/[0.03] ring-1 ring-white/[0.07] px-3 py-1.5 rounded-full"
            >
              <span>{f.icon}</span>
              {f.label}
            </span>
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-12 text-xs text-slate-700">
          Secure · HIPAA-aware · Real-time workflow tracking
        </p>
      </div>
    </div>
  );
}