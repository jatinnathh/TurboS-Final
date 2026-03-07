import { prisma } from "@/lib/prisma";
import { getAdminFromToken } from "@/lib/doctorAuth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "../_component/Logoutbutton";

export default async function AdminDashboard() {
  const admin = await getAdminFromToken();
  if (!admin) redirect("/doctor/login");

  // ── Core counts ─────────────────────────────────────────────────────────
  const [
    totalPatients,
    totalDoctors,
    totalRequests,
    totalLabTests,
    totalPrescriptions,
    totalBills,
    totalPharmacyOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.doctor.count({ where: { role: "DOCTOR" } }),
    prisma.request.count(),
    prisma.labTest.count(),
    prisma.prescription.count(),
    prisma.bill.count(),
    prisma.pharmacyOrder.count(),
  ]);

  // ── Revenue ──────────────────────────────────────────────────────────────
  const revenueData = await prisma.bill.aggregate({ _sum: { totalAmount: true } });
  const revenue = revenueData._sum.totalAmount ?? 0;

  const paidRevenue = await prisma.bill.aggregate({
    where: { status: "PAID" },
    _sum: { totalAmount: true },
  });
  const paid = paidRevenue._sum.totalAmount ?? 0;

  // ── Request breakdown by status ─────────────────────────────────────────
  const requestsByStatus = await prisma.request.groupBy({
    by: ["status"],
    _count: true,
  });

  // ── Request breakdown by type ────────────────────────────────────────────
  const requestsByType = await prisma.request.groupBy({
    by: ["type"],
    _count: true,
    orderBy: { _count: { type: "desc" } },
  });

  // ── Requests by department ───────────────────────────────────────────────
  const requestsByDept = await prisma.request.groupBy({
    by: ["department"],
    _count: true,
    orderBy: { _count: { department: "desc" } },
    take: 6,
  });

  // ── Lab tests by status ──────────────────────────────────────────────────
  const labByStatus = await prisma.labTest.groupBy({
    by: ["status"],
    _count: true,
  });

  // ── Bill status breakdown ────────────────────────────────────────────────
  const billsByStatus = await prisma.bill.groupBy({
    by: ["status"],
    _count: true,
    _sum: { totalAmount: true },
  });

  // ── Pharmacy order status ────────────────────────────────────────────────
  const pharmacyByStatus = await prisma.pharmacyOrder.groupBy({
    by: ["status"],
    _count: true,
  });

  // ── Doctors by department ────────────────────────────────────────────────
  const doctorsByDept = await prisma.doctor.groupBy({
    by: ["department"],
    _count: true,
    orderBy: { _count: { department: "desc" } },
  });

  // ── Doctors by role ───────────────────────────────────────────────────────
  const doctorsByRole = await prisma.doctor.groupBy({
    by: ["role"],
    _count: true,
  });

  // ── Recent requests ──────────────────────────────────────────────────────
  const recentRequests = await prisma.request.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: { user: true, doctor: true },
  });

  // ── Recent bills ─────────────────────────────────────────────────────────
  const recentBills = await prisma.bill.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { user: true, request: true },
  });

  // ── Top doctors by request count ────────────────────────────────────────
  const topDoctors = await prisma.doctor.findMany({
    where: { role: "DOCTOR" },
    include: { _count: { select: { requests: true, labTests: true, prescriptions: true } } },
    orderBy: { requests: { _count: "desc" } },
    take: 5,
  });

  // ── Priority breakdown ────────────────────────────────────────────────────
  const requestsByPriority = await prisma.request.groupBy({
    by: ["priority"],
    _count: true,
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const statusColor: Record<string, string> = {
    PENDING:     "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30",
    APPROVED:    "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
    REJECTED:    "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30",
    IN_PROGRESS: "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30",
    COMPLETED:   "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30",
    GENERATED:   "bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30",
    PAID:        "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
    READY:       "bg-teal-500/15 text-teal-400 ring-1 ring-teal-500/30",
    CANCELLED:   "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30",
    PROCESSING:  "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30",
  };

  const priorityColor: Record<string, string> = {
    LOW:      "bg-slate-500/15 text-slate-400",
    MEDIUM:   "bg-amber-500/15 text-amber-400",
    HIGH:     "bg-orange-500/15 text-orange-400",
    CRITICAL: "bg-rose-500/15 text-rose-400",
  };

  const typeIcon: Record<string, string> = {
    APPOINTMENT:     "🗓",
    LAB_TEST:        "🧪",
    EMERGENCY:       "🚨",
    PRESCRIPTION:    "💊",
    ROOM_BOOKING:    "🛏",
    REPORT_DOWNLOAD: "📄",
  };

  const deptBar = (dept: string) => {
    const colors: Record<string, string> = {
      EMERGENCY:  "bg-rose-500",
      LABORATORY: "bg-teal-500",
      RADIOLOGY:  "bg-violet-500",
      CARDIOLOGY: "bg-sky-500",
      PHARMACY:   "bg-emerald-500",
      GENERAL:    "bg-slate-400",
      NEUROLOGY:  "bg-indigo-500",
      ORTHOPEDICS:"bg-amber-500",
      PEDIATRICS: "bg-pink-500",
    };
    return colors[dept?.toUpperCase()] ?? "bg-slate-500";
  };

  const maxDeptCount = Math.max(...requestsByDept.map((d) => d._count));
  const maxDoctorDeptCount = Math.max(...doctorsByDept.map((d) => d._count));

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 font-sans">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 border-b border-white/5 bg-[#080c14]/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5 text-slate-100 font-bold tracking-tight">
          <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_theme(colors.rose.400)] animate-pulse" />
          MediFlow
          <span className="ml-1.5 text-[11px] font-semibold uppercase tracking-widest text-rose-400/70 bg-rose-400/10 px-2 py-0.5 rounded-full ring-1 ring-rose-400/20">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500">Logged in as <span className="text-slate-300 font-semibold">{admin.name}</span></span>
          <Link href="/doctor/dashboard" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            Doctor View →
          </Link>
          <LogoutButton />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-5 md:px-8 py-10 space-y-10">

        {/* ── Page Header ── */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-400/70 mb-1">Overview</p>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tighter text-slate-100">
            Admin Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Hospital-wide metrics across patients, doctors, requests, billing, and more
          </p>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Patients",      value: totalPatients,      color: "text-sky-400",     sub: "Registered users",       icon: "👤" },
            { label: "Doctors",       value: totalDoctors,       color: "text-emerald-400", sub: "Active physicians",       icon: "🩺" },
            { label: "Requests",      value: totalRequests,      color: "text-violet-400",  sub: "All time",                icon: "📋" },
            { label: "Lab Tests",     value: totalLabTests,      color: "text-teal-400",    sub: "Ordered tests",           icon: "🧪" },
            { label: "Prescriptions", value: totalPrescriptions, color: "text-amber-400",   sub: "All prescriptions",       icon: "💊" },
            { label: "Bills",         value: totalBills,         color: "text-indigo-400",  sub: "Total invoices",          icon: "🧾" },
            { label: "Pharmacy",      value: totalPharmacyOrders,color: "text-pink-400",    sub: "Pharmacy orders",         icon: "🏪" },
            { label: "Revenue",       value: `₹${revenue.toLocaleString("en-IN")}`, color: "text-rose-400", sub: `₹${paid.toLocaleString("en-IN")} collected`, icon: "💰" },
          ].map((k) => (
            <div key={k.label} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl px-4 py-4 hover:border-white/[0.12] transition-colors">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{k.label}</p>
                <span className="text-base leading-none">{k.icon}</span>
              </div>
              <p className={`text-3xl font-extrabold tracking-tighter leading-none ${k.color}`}>{k.value}</p>
              <p className="text-[10px] text-slate-600 mt-1.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Row 1: Request Status + Request Type ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Request Status Breakdown */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-base">📊</span>
              <h3 className="text-sm font-bold text-slate-200">Requests by Status</h3>
              <span className="ml-auto text-xs text-slate-600 bg-white/5 border border-white/[0.07] rounded-full px-2.5 py-0.5">{totalRequests} total</span>
            </div>
            <div className="space-y-3">
              {requestsByStatus.map((s) => {
                const pct = totalRequests > 0 ? Math.round((s._count / totalRequests) * 100) : 0;
                const barColors: Record<string, string> = {
                  PENDING: "bg-amber-500", APPROVED: "bg-emerald-500",
                  REJECTED: "bg-rose-500", IN_PROGRESS: "bg-sky-500", COMPLETED: "bg-violet-500",
                };
                return (
                  <div key={s.status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor[s.status] ?? "bg-slate-500/15 text-slate-400"}`}>
                        {s.status.replace("_", " ")}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300">{s._count}</span>
                        <span className="text-[10px] text-slate-600">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColors[s.status] ?? "bg-slate-500"} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Request Type Breakdown */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-base">🗂</span>
              <h3 className="text-sm font-bold text-slate-200">Requests by Type</h3>
            </div>
            <div className="space-y-3">
              {requestsByType.map((t) => {
                const pct = totalRequests > 0 ? Math.round((t._count / totalRequests) * 100) : 0;
                return (
                  <div key={t.type} className="flex items-center gap-3">
                    <span className="text-lg w-7 shrink-0 text-center leading-none">{typeIcon[t.type] ?? "📋"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-300 truncate">
                          {t.type.split("_").map((w) => w[0] + w.slice(1).toLowerCase()).join(" ")}
                        </span>
                        <span className="text-xs font-bold text-slate-400 ml-2 shrink-0">{t._count}</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-600 w-7 text-right shrink-0">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Row 2: Priority + Lab Status + Pharmacy ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Priority Distribution */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-base">🚦</span>
              <h3 className="text-sm font-bold text-slate-200">Priority Distribution</h3>
            </div>
            <div className="space-y-3">
              {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((pri) => {
                const found = requestsByPriority.find((r) => r.priority === pri);
                const count = found?._count ?? 0;
                const pct = totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0;
                const barColors: Record<string, string> = {
                  CRITICAL: "bg-rose-500", HIGH: "bg-orange-500", MEDIUM: "bg-amber-500", LOW: "bg-slate-400",
                };
                return (
                  <div key={pri}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${priorityColor[pri]}`}>
                        {pri}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300">{count}</span>
                        <span className="text-[10px] text-slate-600">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColors[pri]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lab Tests by Status */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-base">🧪</span>
              <h3 className="text-sm font-bold text-slate-200">Lab Test Status</h3>
              <span className="ml-auto text-xs text-slate-600 bg-white/5 border border-white/[0.07] rounded-full px-2.5 py-0.5">{totalLabTests}</span>
            </div>
            <div className="space-y-4">
              {labByStatus.map((l) => {
                const pct = totalLabTests > 0 ? Math.round((l._count / totalLabTests) * 100) : 0;
                const labColors: Record<string, { bar: string; badge: string }> = {
                  PENDING:     { bar: "bg-amber-500",  badge: "bg-amber-500/15 text-amber-400" },
                  IN_PROGRESS: { bar: "bg-sky-500",    badge: "bg-sky-500/15 text-sky-400" },
                  COMPLETED:   { bar: "bg-emerald-500",badge: "bg-emerald-500/15 text-emerald-400" },
                };
                const c = labColors[l.status] ?? { bar: "bg-slate-500", badge: "bg-slate-500/15 text-slate-400" };
                return (
                  <div key={l.status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${c.badge}`}>
                        {l.status.replace("_", " ")}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300">{l._count}</span>
                        <span className="text-[10px] text-slate-600">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pharmacy Orders by Status */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-base">🏪</span>
              <h3 className="text-sm font-bold text-slate-200">Pharmacy Orders</h3>
              <span className="ml-auto text-xs text-slate-600 bg-white/5 border border-white/[0.07] rounded-full px-2.5 py-0.5">{totalPharmacyOrders}</span>
            </div>
            <div className="space-y-4">
              {pharmacyByStatus.map((p) => {
                const pct = totalPharmacyOrders > 0 ? Math.round((p._count / totalPharmacyOrders) * 100) : 0;
                return (
                  <div key={p.status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor[p.status] ?? "bg-slate-500/15 text-slate-400"}`}>
                        {p.status}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300">{p._count}</span>
                        <span className="text-[10px] text-slate-600">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {pharmacyByStatus.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 gap-2">
                  <span className="text-2xl">🏪</span>
                  <p className="text-xs text-slate-500">No pharmacy orders yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Row 3: Dept bar charts ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Requests by Department */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-base">🏥</span>
              <h3 className="text-sm font-bold text-slate-200">Requests by Department</h3>
            </div>
            <div className="space-y-3">
              {requestsByDept.filter((d) => d.department).map((d) => {
                const pct = maxDeptCount > 0 ? Math.round((d._count / maxDeptCount) * 100) : 0;
                return (
                  <div key={d.department} className="flex items-center gap-3">
                    <span className="text-[10px] font-semibold text-slate-400 w-24 truncate shrink-0">
                      {d.department}
                    </span>
                    <div className="flex-1 h-5 bg-white/[0.05] rounded-lg overflow-hidden">
                      <div
                        className={`h-full rounded-lg ${deptBar(d.department ?? "")} opacity-80`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-300 w-6 text-right shrink-0">{d._count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Doctors by Department */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-base">🩺</span>
              <h3 className="text-sm font-bold text-slate-200">Doctors by Department</h3>
            </div>
            <div className="space-y-3">
              {doctorsByDept.map((d) => {
                const pct = maxDoctorDeptCount > 0 ? Math.round((d._count / maxDoctorDeptCount) * 100) : 0;
                return (
                  <div key={d.department} className="flex items-center gap-3">
                    <span className="text-[10px] font-semibold text-slate-400 w-24 truncate shrink-0">
                      {d.department}
                    </span>
                    <div className="flex-1 h-5 bg-white/[0.05] rounded-lg overflow-hidden">
                      <div
                        className={`h-full rounded-lg ${deptBar(d.department)} opacity-80`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-300 w-6 text-right shrink-0">{d._count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Row 4: Billing Summary + Doctor Roles ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Billing Breakdown */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-base">💰</span>
              <h3 className="text-sm font-bold text-slate-200">Billing Summary</h3>
            </div>

            {/* Revenue donut (CSS only) */}
            <div className="flex items-center gap-6 mb-5">
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke="#10b981" strokeWidth="3"
                    strokeDasharray={`${revenue > 0 ? (paid / revenue) * 100 : 0} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-emerald-400">
                    {revenue > 0 ? Math.round((paid / revenue) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Total Billed</p>
                  <p className="text-lg font-extrabold text-slate-100">₹{revenue.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Collected</p>
                  <p className="text-base font-bold text-emerald-400">₹{paid.toLocaleString("en-IN")}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {billsByStatus.map((b) => {
                const pct = totalBills > 0 ? Math.round((b._count / totalBills) * 100) : 0;
                const barColors: Record<string, string> = { PENDING: "bg-amber-500", GENERATED: "bg-indigo-500", PAID: "bg-emerald-500" };
                return (
                  <div key={b.status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor[b.status] ?? "bg-slate-500/15 text-slate-400"}`}>
                        {b.status}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-500">₹{(b._sum.totalAmount ?? 0).toLocaleString("en-IN")}</span>
                        <span className="text-xs font-bold text-slate-300">{b._count}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColors[b.status] ?? "bg-slate-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Doctor Roles + Top Doctors */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-base">👨‍⚕️</span>
              <h3 className="text-sm font-bold text-slate-200">Staff by Role</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {doctorsByRole.map((r) => {
                const roleColors: Record<string, string> = {
                  DOCTOR:   "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/25",
                  ADMIN:    "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/25",
                  PHARMACY: "bg-pink-500/10 text-pink-400 ring-1 ring-pink-500/25",
                  LAB:      "bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/25",
                };
                return (
                  <div key={r.role} className={`rounded-xl px-3 py-3 ${roleColors[r.role] ?? "bg-slate-500/10 text-slate-400"}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70">{r.role}</p>
                    <p className="text-2xl font-extrabold mt-0.5">{r._count}</p>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">Top Doctors by Caseload</p>
            <div className="space-y-2">
              {topDoctors.map((doc, i) => (
                <div key={doc.id} className="flex items-center gap-3 py-1.5">
                  <span className="text-[10px] font-bold text-slate-600 w-4 shrink-0">{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-emerald-400">
                      {doc.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{doc.name}</p>
                    <p className="text-[10px] text-slate-500">{doc.department}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-500">{doc._count.requests}r</span>
                    <span className="text-[10px] text-slate-600">·</span>
                    <span className="text-[10px] text-slate-500">{doc._count.labTests}l</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent Requests Table ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Recent Requests</p>
            <span className="text-xs text-slate-600 bg-white/5 border border-white/[0.07] rounded-full px-3 py-0.5">
              Showing latest 8
            </span>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="hidden md:grid grid-cols-[2rem_1fr_8rem_9rem_7rem_8rem] gap-4 px-6 py-3 bg-white/[0.03] border-b border-white/[0.05]">
              {["", "Request", "Department", "Status", "Priority", "Patient"].map((h, i) => (
                <span key={i} className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">{h}</span>
              ))}
            </div>
            {recentRequests.map((req) => {
              const p = { LOW: "text-slate-400", MEDIUM: "text-amber-400", HIGH: "text-orange-400", CRITICAL: "text-rose-400" };
              return (
                <div key={req.id} className="flex flex-wrap md:grid md:grid-cols-[2rem_1fr_8rem_9rem_7rem_8rem] gap-x-4 gap-y-1.5 items-center px-6 py-3.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors">
                  <span className="text-lg leading-none">{typeIcon[req.type] ?? "📋"}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">{req.title}</p>
                    {req.doctor && <p className="text-[10px] text-slate-500">Dr. {req.doctor.name}</p>}
                  </div>
                  <span className="text-xs text-slate-500 truncate">{req.department ?? "—"}</span>
                  <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit ${statusColor[req.status] ?? "bg-slate-500/15 text-slate-400"}`}>
                    {req.status.replace("_", " ")}
                  </span>
                  <span className={`text-xs font-semibold ${p[req.priority] ?? "text-slate-400"}`}>{req.priority}</span>
                  <span className="text-xs text-slate-500 truncate">{req.user.email.split("@")[0]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Recent Bills ── */}
        {recentBills.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Recent Bills</p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
              <div className="hidden md:grid grid-cols-[1fr_8rem_8rem_7rem] gap-4 px-6 py-3 bg-white/[0.03] border-b border-white/[0.05]">
                {["Patient / Request", "Amount", "Status", "Date"].map((h) => (
                  <span key={h} className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">{h}</span>
                ))}
              </div>
              {recentBills.map((bill) => (
                <div key={bill.id} className="flex flex-wrap md:grid md:grid-cols-[1fr_8rem_8rem_7rem] gap-x-4 gap-y-1.5 items-center px-6 py-3.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">{bill.request?.title ?? "—"}</p>
                    <p className="text-[10px] text-slate-500">{bill.user.email.split("@")[0]}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-100">₹{Number(bill.totalAmount).toLocaleString("en-IN")}</span>
                  <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit ${statusColor[bill.status as string] ?? "bg-slate-500/15 text-slate-400"}`}>
                    {bill.status as string}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}