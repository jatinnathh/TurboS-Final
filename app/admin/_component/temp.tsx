"use client";

// Place at: app/doctor/admin/dashboard/_component/AdminDashboardClient.tsx

import { useState, useMemo } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
interface RecentRequest {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  department: string | null;
  createdAt: string;
  user: { email: string };
  doctor: { name: string } | null;
}

interface RecentBill {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  user: { email: string };
  request: { title: string } | null;
}

interface TopDoctor {
  id: string;
  name: string;
  department: string;
  _count: { requests: number; labTests: number; prescriptions: number };
}

interface GroupCount { status?: string; type?: string; priority?: string; role?: string; department?: string; _count: number; _sum?: { totalAmount: number | null } }

interface Props {
  adminName: string;
  // KPI
  totalPatients: number;
  totalDoctors: number;
  totalRequests: number;
  totalLabTests: number;
  totalPrescriptions: number;
  totalBills: number;
  totalPharmacyOrders: number;
  revenue: number;
  paid: number;
  // Charts
  requestsByStatus: GroupCount[];
  requestsByType: GroupCount[];
  requestsByDept: GroupCount[];
  labByStatus: GroupCount[];
  billsByStatus: GroupCount[];
  pharmacyByStatus: GroupCount[];
  doctorsByDept: GroupCount[];
  doctorsByRole: GroupCount[];
  requestsByPriority: GroupCount[];
  // Tables
  recentRequests: RecentRequest[];
  recentBills: RecentBill[];
  topDoctors: TopDoctor[];
}

// ── Static helpers ────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
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
const PRIORITY_COLOR: Record<string, string> = {
  LOW: "bg-slate-500/15 text-slate-400", MEDIUM: "bg-amber-500/15 text-amber-400",
  HIGH: "bg-orange-500/15 text-orange-400", CRITICAL: "bg-rose-500/15 text-rose-400",
};
const PRIORITY_TEXT: Record<string, string> = {
  LOW: "text-slate-400", MEDIUM: "text-amber-400", HIGH: "text-orange-400", CRITICAL: "text-rose-400",
};
const TYPE_ICON: Record<string, string> = {
  APPOINTMENT: "🗓", LAB_TEST: "🧪", EMERGENCY: "🚨",
  PRESCRIPTION: "💊", ROOM_BOOKING: "🛏", REPORT_DOWNLOAD: "📄",
};
const DEPT_COLOR = (dept: string) => {
  const m: Record<string, string> = {
    EMERGENCY: "bg-rose-500", LABORATORY: "bg-teal-500", RADIOLOGY: "bg-violet-500",
    CARDIOLOGY: "bg-sky-500", PHARMACY: "bg-emerald-500", GENERAL: "bg-slate-400",
    NEUROLOGY: "bg-indigo-500", ORTHOPEDICS: "bg-amber-500", PEDIATRICS: "bg-pink-500",
  };
  return m[dept?.toUpperCase()] ?? "bg-slate-500";
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminDashboardClient(props: Props) {
  const {
    adminName, totalPatients, totalDoctors, totalRequests, totalLabTests,
    totalPrescriptions, totalBills, totalPharmacyOrders, revenue, paid,
    requestsByStatus, requestsByType, requestsByDept, labByStatus,
    billsByStatus, pharmacyByStatus, doctorsByDept, doctorsByRole,
    requestsByPriority, recentRequests, recentBills, topDoctors,
  } = props;

  // ── Request table state ───────────────────────────────────────────────────
  const [reqSearch, setReqSearch]         = useState("");
  const [reqStatusFilter, setReqStatus]   = useState("ALL");
  const [reqPriorityFilter, setReqPriority] = useState("ALL");
  const [reqTypeFilter, setReqType]       = useState("ALL");
  const [reqSort, setReqSort]             = useState<"newest"|"oldest"|"priority">("newest");
  const [reqPage, setReqPage]             = useState(0);
  const REQ_PAGE_SIZE = 5;

  // ── Bill table state ──────────────────────────────────────────────────────
  const [billSearch, setBillSearch]       = useState("");
  const [billStatusFilter, setBillStatus] = useState("ALL");
  const [billSort, setBillSort]           = useState<"newest"|"oldest"|"amount_desc"|"amount_asc">("newest");

  // ── Chart view toggle ─────────────────────────────────────────────────────
  const [chartView, setChartView]         = useState<"status"|"type"|"priority">("status");

  // ── Active section highlight ──────────────────────────────────────────────
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // ── Filtered & sorted requests ────────────────────────────────────────────
  const PRIORITY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

  const filteredRequests = useMemo(() => {
    let list = [...recentRequests];
    if (reqSearch) list = list.filter(r =>
      r.title.toLowerCase().includes(reqSearch.toLowerCase()) ||
      r.user.email.toLowerCase().includes(reqSearch.toLowerCase()) ||
      (r.doctor?.name ?? "").toLowerCase().includes(reqSearch.toLowerCase()) ||
      (r.department ?? "").toLowerCase().includes(reqSearch.toLowerCase())
    );
    if (reqStatusFilter !== "ALL") list = list.filter(r => r.status === reqStatusFilter);
    if (reqPriorityFilter !== "ALL") list = list.filter(r => r.priority === reqPriorityFilter);
    if (reqTypeFilter !== "ALL") list = list.filter(r => r.type === reqTypeFilter);
    if (reqSort === "newest") list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (reqSort === "oldest") list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (reqSort === "priority") list.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));
    return list;
  }, [recentRequests, reqSearch, reqStatusFilter, reqPriorityFilter, reqTypeFilter, reqSort]);

  const pagedRequests = filteredRequests.slice(reqPage * REQ_PAGE_SIZE, (reqPage + 1) * REQ_PAGE_SIZE);
  const totalReqPages = Math.ceil(filteredRequests.length / REQ_PAGE_SIZE);

  // ── Filtered & sorted bills ───────────────────────────────────────────────
  const filteredBills = useMemo(() => {
    let list = [...recentBills];
    if (billSearch) list = list.filter(b =>
      (b.request?.title ?? "").toLowerCase().includes(billSearch.toLowerCase()) ||
      b.user.email.toLowerCase().includes(billSearch.toLowerCase())
    );
    if (billStatusFilter !== "ALL") list = list.filter(b => b.status === billStatusFilter);
    if (billSort === "newest") list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (billSort === "oldest") list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (billSort === "amount_desc") list.sort((a, b) => b.totalAmount - a.totalAmount);
    if (billSort === "amount_asc") list.sort((a, b) => a.totalAmount - b.totalAmount);
    return list;
  }, [recentBills, billSearch, billStatusFilter, billSort]);

  // ── Chart data for the toggled view ──────────────────────────────────────
  const chartData = useMemo(() => {
    if (chartView === "status") return requestsByStatus.map(s => ({
      label: (s.status ?? "").replace("_", " "),
      count: s._count,
      color: { PENDING: "bg-amber-500", APPROVED: "bg-emerald-500", REJECTED: "bg-rose-500", IN_PROGRESS: "bg-sky-500", COMPLETED: "bg-violet-500" }[s.status!] ?? "bg-slate-500",
      badge: STATUS_COLOR[s.status!] ?? "",
    }));
    if (chartView === "type") return requestsByType.map(t => ({
      label: (t.type ?? "").split("_").map(w => w[0] + w.slice(1).toLowerCase()).join(" "),
      count: t._count,
      color: "bg-gradient-to-r from-sky-500 to-violet-500",
      badge: "",
    }));
    return ["CRITICAL","HIGH","MEDIUM","LOW"].map(pri => {
      const found = requestsByPriority.find(r => r.priority === pri);
      return {
        label: pri,
        count: found?._count ?? 0,
        color: { CRITICAL: "bg-rose-500", HIGH: "bg-orange-500", MEDIUM: "bg-amber-500", LOW: "bg-slate-400" }[pri] ?? "bg-slate-500",
        badge: PRIORITY_COLOR[pri] ?? "",
      };
    });
  }, [chartView, requestsByStatus, requestsByType, requestsByPriority]);

  const chartTotal = chartData.reduce((s, d) => s + d.count, 0);

  // ── Shared select style ───────────────────────────────────────────────────
  const selectCls = "pl-3 pr-7 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-slate-300 appearance-none focus:outline-none focus:border-white/20 transition-all cursor-pointer [&>option]:bg-[#0d1117]";

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 font-sans">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 border-b border-white/5 bg-[#080c14]/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5 text-slate-100 font-bold tracking-tight">
          <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)] animate-pulse" />
          MediFlow
          <span className="ml-1.5 text-[11px] font-semibold uppercase tracking-widest text-rose-400/70 bg-rose-400/10 px-2 py-0.5 rounded-full ring-1 ring-rose-400/20">Admin</span>
        </div>
        <div className="flex items-center gap-3">
         
        
          {/* LogoutButton is rendered by the server page wrapper */}
          <div id="logout-slot" />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-5 md:px-8 py-10 space-y-10">

        {/* ── Header ── */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-400/70 mb-1">Overview</p>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tighter text-slate-100">Admin Analytics</h1>
            <p className="mt-1 text-sm text-slate-500">Hospital-wide metrics — click any card to highlight</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest">Last updated</p>
            <p className="text-xs font-semibold text-slate-400">{new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Patients",      value: totalPatients,       color: "text-sky-400",     glow: "hover:shadow-[0_0_20px_-4px_rgba(56,189,248,0.3)]",   sub: "Registered users",   icon: "👤", id: "patients" },
            { label: "Doctors",       value: totalDoctors,        color: "text-emerald-400", glow: "hover:shadow-[0_0_20px_-4px_rgba(52,211,153,0.3)]",   sub: "Active physicians",  icon: "🩺", id: "doctors"  },
            { label: "Requests",      value: totalRequests,       color: "text-violet-400",  glow: "hover:shadow-[0_0_20px_-4px_rgba(167,139,250,0.3)]",  sub: "All time",           icon: "📋", id: "requests" },
            { label: "Lab Tests",     value: totalLabTests,       color: "text-teal-400",    glow: "hover:shadow-[0_0_20px_-4px_rgba(45,212,191,0.3)]",   sub: "Ordered tests",      icon: "🧪", id: "lab"      },
            { label: "Prescriptions", value: totalPrescriptions,  color: "text-amber-400",   glow: "hover:shadow-[0_0_20px_-4px_rgba(251,191,36,0.3)]",   sub: "All prescriptions",  icon: "💊", id: "rx"       },
            { label: "Bills",         value: totalBills,          color: "text-indigo-400",  glow: "hover:shadow-[0_0_20px_-4px_rgba(129,140,248,0.3)]",  sub: "Total invoices",     icon: "🧾", id: "bills"    },
            { label: "Pharmacy",      value: totalPharmacyOrders, color: "text-pink-400",    glow: "hover:shadow-[0_0_20px_-4px_rgba(244,114,182,0.3)]",  sub: "Pharmacy orders",    icon: "🏪", id: "pharmacy" },
            { label: "Revenue",       value: `₹${revenue.toLocaleString("en-IN")}`, color: "text-rose-400", glow: "hover:shadow-[0_0_20px_-4px_rgba(251,113,133,0.3)]", sub: `₹${paid.toLocaleString("en-IN")} collected`, icon: "💰", id: "revenue" },
          ].map((k) => (
            <button
              key={k.label}
              onClick={() => setExpandedSection(expandedSection === k.id ? null : k.id)}
              className={`text-left bg-white/[0.03] border rounded-2xl px-4 py-4 transition-all cursor-pointer ${
                expandedSection === k.id
                  ? "border-white/20 bg-white/[0.06]"
                  : "border-white/[0.07] hover:border-white/[0.14]"
              } ${k.glow}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{k.label}</p>
                <span className="text-base leading-none">{k.icon}</span>
              </div>
              <p className={`text-3xl font-extrabold tracking-tighter leading-none ${k.color}`}>{k.value}</p>
              <p className="text-[10px] text-slate-600 mt-1.5">{k.sub}</p>
            </button>
          ))}
        </div>

        {/* ── Unified chart panel with toggle ── */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="text-base">📊</span>
            <h3 className="text-sm font-bold text-slate-200">Requests Overview</h3>
            <span className="text-xs text-slate-600 bg-white/5 border border-white/[0.07] rounded-full px-2.5 py-0.5">{totalRequests} total</span>
            {/* Toggle buttons */}
            <div className="ml-auto flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1">
              {(["status","type","priority"] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setChartView(v)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    chartView === v ? "bg-white/[0.1] text-slate-100" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {chartData.map((d) => {
              const pct = chartTotal > 0 ? Math.round((d.count / chartTotal) * 100) : 0;
              return (
                <div key={d.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${d.badge || "bg-white/5 text-slate-400"}`}>
                      {d.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300">{d.count}</span>
                      <span className="text-[10px] text-slate-600 w-7 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${d.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Row: Lab + Pharmacy + Billing donut ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Lab Tests */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <span>🧪</span>
              <h3 className="text-sm font-bold text-slate-200">Lab Test Status</h3>
              <span className="ml-auto text-xs text-slate-600 bg-white/5 border border-white/[0.07] rounded-full px-2.5 py-0.5">{totalLabTests}</span>
            </div>
            <div className="space-y-3">
              {labByStatus.map((l) => {
                const pct = totalLabTests > 0 ? Math.round((l._count / totalLabTests) * 100) : 0;
                const c = { PENDING: { bar:"bg-amber-500",badge:"bg-amber-500/15 text-amber-400" }, IN_PROGRESS: { bar:"bg-sky-500",badge:"bg-sky-500/15 text-sky-400" }, COMPLETED: { bar:"bg-emerald-500",badge:"bg-emerald-500/15 text-emerald-400" } }[l.status!] ?? { bar:"bg-slate-500",badge:"bg-slate-500/15 text-slate-400" };
                return (
                  <div key={l.status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${c.badge}`}>{l.status!.replace("_"," ")}</span>
                      <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-300">{l._count}</span><span className="text-[10px] text-slate-600">{pct}%</span></div>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.bar}`} style={{ width:`${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pharmacy */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <span>🏪</span>
              <h3 className="text-sm font-bold text-slate-200">Pharmacy Orders</h3>
              <span className="ml-auto text-xs text-slate-600 bg-white/5 border border-white/[0.07] rounded-full px-2.5 py-0.5">{totalPharmacyOrders}</span>
            </div>
            <div className="space-y-3">
              {pharmacyByStatus.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2"><span className="text-2xl">🏪</span><p className="text-xs text-slate-500">No pharmacy orders yet</p></div>
              ) : pharmacyByStatus.map((p) => {
                const pct = totalPharmacyOrders > 0 ? Math.round((p._count / totalPharmacyOrders) * 100) : 0;
                return (
                  <div key={p.status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_COLOR[p.status!] ?? "bg-slate-500/15 text-slate-400"}`}>{p.status}</span>
                      <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-300">{p._count}</span><span className="text-[10px] text-slate-600">{pct}%</span></div>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500" style={{ width:`${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Billing donut */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5"><span>💰</span><h3 className="text-sm font-bold text-slate-200">Billing Summary</h3></div>
            <div className="flex items-center gap-5 mb-5">
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3"/>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3"
                    strokeDasharray={`${revenue > 0 ? (paid / revenue) * 100 : 0} 100`} strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-emerald-400">{revenue > 0 ? Math.round((paid/revenue)*100) : 0}%</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <div><p className="text-[10px] text-slate-500 uppercase tracking-widest">Total Billed</p><p className="text-base font-extrabold text-slate-100">₹{revenue.toLocaleString("en-IN")}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase tracking-widest">Collected</p><p className="text-sm font-bold text-emerald-400">₹{paid.toLocaleString("en-IN")}</p></div>
              </div>
            </div>
            <div className="space-y-2">
              {billsByStatus.map((b) => {
                const pct = totalBills > 0 ? Math.round((b._count / totalBills) * 100) : 0;
                const bar = { PENDING:"bg-amber-500", GENERATED:"bg-indigo-500", PAID:"bg-emerald-500" }[b.status!] ?? "bg-slate-500";
                return (
                  <div key={b.status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_COLOR[b.status!] ?? "bg-slate-500/15 text-slate-400"}`}>{b.status}</span>
                      <div className="flex items-center gap-2"><span className="text-[10px] text-slate-500">₹{(b._sum?.totalAmount ?? 0).toLocaleString("en-IN")}</span><span className="text-xs font-bold text-slate-300">{b._count}</span></div>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${bar}`} style={{ width:`${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Row: Dept charts ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: "Requests by Department", data: requestsByDept },
            { title: "Doctors by Department",  data: doctorsByDept  },
          ].map(({ title, data }) => {
            const max = Math.max(...data.map(d => d._count), 1);
            return (
              <div key={title} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5"><span>🏥</span><h3 className="text-sm font-bold text-slate-200">{title}</h3></div>
                <div className="space-y-3">
                  {data.filter(d => d.department).map(d => {
                    const pct = Math.round((d._count / max) * 100);
                    return (
                      <div key={d.department} className="flex items-center gap-3">
                        <span className="text-[10px] font-semibold text-slate-400 w-24 truncate shrink-0">{d.department}</span>
                        <div className="flex-1 h-5 bg-white/[0.05] rounded-lg overflow-hidden">
                          <div className={`h-full rounded-lg ${DEPT_COLOR(d.department!)} opacity-80 transition-all duration-500`} style={{ width:`${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-300 w-6 text-right shrink-0">{d._count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Staff by role + top doctors ── */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5"><span>👨‍⚕️</span><h3 className="text-sm font-bold text-slate-200">Staff Overview</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">By Role</p>
              <div className="grid grid-cols-2 gap-2">
                {doctorsByRole.map((r) => {
                  const c = { DOCTOR:"bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/25", ADMIN:"bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/25", PHARMACY:"bg-pink-500/10 text-pink-400 ring-1 ring-pink-500/25", LAB:"bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/25" }[r.role!] ?? "bg-slate-500/10 text-slate-400";
                  return (
                    <div key={r.role} className={`rounded-xl px-3 py-3 ${c}`}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70">{r.role}</p>
                      <p className="text-2xl font-extrabold mt-0.5">{r._count}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">Top Doctors by Caseload</p>
              <div className="space-y-2">
                {topDoctors.map((doc, i) => (
                  <div key={doc.id} className="flex items-center gap-3 py-1.5 px-3 rounded-xl hover:bg-white/[0.04] transition-colors">
                    <span className="text-[10px] font-bold text-slate-600 w-4 shrink-0">{i + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-emerald-400">{doc.name.split(" ").map(n => n[0]).join("").slice(0,2)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{doc.name}</p>
                      <p className="text-[10px] text-slate-500">{doc.department}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{doc._count.requests}r</span>
                      <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{doc._count.labTests}l</span>
                      <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{doc._count.prescriptions}rx</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* INTERACTIVE REQUESTS TABLE                                         */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Recent Requests</p>
            <span className="text-xs text-slate-600 bg-white/5 border border-white/[0.07] rounded-full px-3 py-0.5">
              {filteredRequests.length} / {recentRequests.length}
            </span>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap gap-2 mb-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                className="w-full pl-8 pr-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-white/20 transition-all"
                placeholder="Search title, patient, doctor..."
                value={reqSearch}
                onChange={e => { setReqSearch(e.target.value); setReqPage(0); }}
              />
            </div>

            {/* Status filter */}
            <div className="relative">
              <select className={selectCls} value={reqStatusFilter} onChange={e => { setReqStatus(e.target.value); setReqPage(0); }}>
                <option value="ALL">All Status</option>
                {["PENDING","APPROVED","REJECTED","IN_PROGRESS","COMPLETED"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </div>

            {/* Priority filter */}
            <div className="relative">
              <select className={selectCls} value={reqPriorityFilter} onChange={e => { setReqPriority(e.target.value); setReqPage(0); }}>
                <option value="ALL">All Priority</option>
                {["CRITICAL","HIGH","MEDIUM","LOW"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </div>

            {/* Type filter */}
            <div className="relative">
              <select className={selectCls} value={reqTypeFilter} onChange={e => { setReqType(e.target.value); setReqPage(0); }}>
                <option value="ALL">All Types</option>
                {["APPOINTMENT","LAB_TEST","EMERGENCY","PRESCRIPTION","ROOM_BOOKING","REPORT_DOWNLOAD"].map(t => <option key={t} value={t}>{t.split("_").map(w=>w[0]+w.slice(1).toLowerCase()).join(" ")}</option>)}
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </div>

            {/* Sort */}
            <div className="relative">
              <select className={selectCls} value={reqSort} onChange={e => setReqSort(e.target.value as any)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">By Priority</option>
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </div>

            {/* Clear */}
            {(reqSearch || reqStatusFilter !== "ALL" || reqPriorityFilter !== "ALL" || reqTypeFilter !== "ALL") && (
              <button
                onClick={() => { setReqSearch(""); setReqStatus("ALL"); setReqPriority("ALL"); setReqType("ALL"); setReqPage(0); }}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-rose-400 bg-white/[0.03] border border-white/[0.07] hover:border-rose-500/20 transition-all"
              >
                ✕ Clear
              </button>
            )}
          </div>

          <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="hidden md:grid grid-cols-[2rem_1fr_8rem_9rem_7rem_8rem] gap-4 px-6 py-3 bg-white/[0.03] border-b border-white/[0.05]">
              {["", "Request", "Department", "Status", "Priority", "Patient"].map((h, i) => (
                <span key={i} className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">{h}</span>
              ))}
            </div>

            {pagedRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <span className="text-3xl">🔍</span>
                <p className="text-sm font-semibold text-slate-500">No requests match your filters</p>
                <button onClick={() => { setReqSearch(""); setReqStatus("ALL"); setReqPriority("ALL"); setReqType("ALL"); }} className="text-xs text-rose-400 hover:underline mt-1">Clear filters</button>
              </div>
            ) : pagedRequests.map((req) => (
              <div key={req.id} className="flex flex-wrap md:grid md:grid-cols-[2rem_1fr_8rem_9rem_7rem_8rem] gap-x-4 gap-y-1.5 items-center px-6 py-3.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors group">
                <span className="text-lg leading-none">{TYPE_ICON[req.type] ?? "📋"}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors">{req.title}</p>
                  {req.doctor && <p className="text-[10px] text-slate-500">Dr. {req.doctor.name}</p>}
                </div>
                <span className="text-xs text-slate-500 truncate hidden md:block">{req.department ?? "—"}</span>
                <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit ${STATUS_COLOR[req.status] ?? "bg-slate-500/15 text-slate-400"}`}>
                  {req.status.replace("_"," ")}
                </span>
                <span className={`text-xs font-semibold ${PRIORITY_TEXT[req.priority] ?? "text-slate-400"}`}>{req.priority}</span>
                <span className="text-xs text-slate-500 truncate hidden md:block">{req.user.email.split("@")[0]}</span>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalReqPages > 1 && (
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-slate-600">
                Page {reqPage + 1} of {totalReqPages} · {filteredRequests.length} results
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setReqPage(p => Math.max(0, p - 1))}
                  disabled={reqPage === 0}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalReqPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setReqPage(i)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                      reqPage === i ? "bg-white/[0.1] text-slate-100" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setReqPage(p => Math.min(totalReqPages - 1, p + 1))}
                  disabled={reqPage === totalReqPages - 1}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* INTERACTIVE BILLS TABLE                                            */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {recentBills.length > 0 && (
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Recent Bills</p>
              <span className="text-xs text-slate-600 bg-white/5 border border-white/[0.07] rounded-full px-3 py-0.5">
                {filteredBills.length} / {recentBills.length}
              </span>
            </div>

            {/* Bill filters */}
            <div className="flex flex-wrap gap-2 mb-3">
              <div className="relative flex-1 min-w-[180px]">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                  className="w-full pl-8 pr-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-white/20 transition-all"
                  placeholder="Search patient or request..."
                  value={billSearch}
                  onChange={e => setBillSearch(e.target.value)}
                />
              </div>
              <div className="relative">
                <select className={selectCls} value={billStatusFilter} onChange={e => setBillStatus(e.target.value)}>
                  <option value="ALL">All Status</option>
                  {["PENDING","GENERATED","PAID"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </div>
              <div className="relative">
                <select className={selectCls} value={billSort} onChange={e => setBillSort(e.target.value as any)}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount_desc">Amount ↓</option>
                  <option value="amount_asc">Amount ↑</option>
                </select>
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
              <div className="hidden md:grid grid-cols-[1fr_8rem_8rem_7rem] gap-4 px-6 py-3 bg-white/[0.03] border-b border-white/[0.05]">
                {["Patient / Request", "Amount", "Status", "Date"].map((h) => (
                  <span key={h} className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">{h}</span>
                ))}
              </div>

              {filteredBills.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <span className="text-3xl">🧾</span>
                  <p className="text-sm font-semibold text-slate-500">No bills match your filters</p>
                </div>
              ) : filteredBills.map((bill) => (
                <div key={bill.id} className="flex flex-wrap md:grid md:grid-cols-[1fr_8rem_8rem_7rem] gap-x-4 gap-y-1.5 items-center px-6 py-3.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">{bill.request?.title ?? "—"}</p>
                    <p className="text-[10px] text-slate-500">{bill.user.email.split("@")[0]}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-100">₹{Number(bill.totalAmount).toLocaleString("en-IN")}</span>
                  <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit ${STATUS_COLOR[bill.status] ?? "bg-slate-500/15 text-slate-400"}`}>
                    {bill.status}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(bill.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}
                  </span>
                </div>
              ))}
            </div>

            {/* Bill totals summary */}
            <div className="flex items-center justify-end gap-4 mt-3 px-2">
              <p className="text-xs text-slate-600">
                Showing {filteredBills.length} bills ·{" "}
                <span className="text-slate-400 font-semibold">
                  Total ₹{filteredBills.reduce((s, b) => s + b.totalAmount, 0).toLocaleString("en-IN")}
                </span>
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}