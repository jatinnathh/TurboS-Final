"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import FlowDiagram from "./FlowDiagram";

/* ── Types ── */

interface LogEntry {
    id: string;
    department: string;
    action: string;
    performedBy: string | null;
    status: "COMPLETED" | "IN_PROGRESS" | "PENDING";
    createdAt: string;
}

interface RequestItem {
    id: string;
    type: string;
    title: string;
    status: string;
    priority: string;
    department: string | null;
    doctorName: string | null;
    createdAt: string;
    logs: LogEntry[];
}

interface ActivityLogEntry {
    id: string;
    department: string;
    action: string;
    performedBy: string | null;
    status: "COMPLETED" | "IN_PROGRESS" | "PENDING";
    createdAt: string;
    request: {
        id: string;
        title: string;
        type: string;
        status: string;
        priority: string;
        department: string | null;
    };
}

/* ── Constants ── */

const STATUS_COLOR: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30",
    APPROVED: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30",
    REJECTED: "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30",
    IN_PROGRESS: "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30",
    COMPLETED: "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/30",
};

const TYPE_ICON: Record<string, string> = {
    APPOINTMENT: "🗓",
    LAB_TEST: "🧪",
    EMERGENCY: "🚨",
    PRESCRIPTION: "💊",
    ROOM_BOOKING: "🛏",
    REPORT_DOWNLOAD: "📄",
};

const LOG_STATUS_STYLE: Record<string, { dot: string; bg: string }> = {
    COMPLETED: { dot: "bg-teal-400", bg: "border-teal-500/20" },
    IN_PROGRESS: { dot: "bg-sky-400 animate-pulse", bg: "border-sky-500/20" },
    PENDING: { dot: "bg-slate-500", bg: "border-white/[0.06]" },
};

type PanelMode = "flow" | "activity";

/* ── Component ── */

export default function RequestFlowPanel() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<PanelMode>("flow");
    const [requests, setRequests] = useState<RequestItem[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [doctorId, setDoctorId] = useState<string | null>(null);

    const isDoctor = pathname?.startsWith("/doctor") && pathname !== "/doctor/login";

    /* ── Resolve doctorId once on mount (doctor pages only) ── */
    useEffect(() => {
        if (!isDoctor) return;
        fetch("/api/doctor/me", { credentials: "include" })
            .then((r) => r.ok ? r.json() : null)
            .then((data) => {
                if (data?.authenticated && data.doctorId) {
                    setDoctorId(data.doctorId);
                }
            })
            .catch(() => { /* silent */ });
    }, [isDoctor]);

    /* ── Fetchers ── */

    const fetchFlow = useCallback(async () => {
        setLoading(true);
        try {
            const url = isDoctor && doctorId
                ? `/api/request/flow?doctorId=${doctorId}`
                : "/api/request/flow";
            const res = await fetch(url, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests ?? []);
            }
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [isDoctor, doctorId]);

    const fetchActivity = useCallback(async () => {
        setLoading(true);
        try {
            const url = isDoctor && doctorId
                ? `/api/request/activity?doctorId=${doctorId}`
                : "/api/request/activity";
            const res = await fetch(url, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setActivityLogs(data.logs ?? []);
            }
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [isDoctor, doctorId]);

    useEffect(() => {
        if (!open) return;
        // On doctor pages, wait until we've resolved the doctorId before fetching
        if (isDoctor && !doctorId) return;
        if (mode === "flow") fetchFlow();
        else fetchActivity();
    }, [open, mode, fetchFlow, fetchActivity, isDoctor, doctorId]);

    /* ── Body margin management ── */
    useEffect(() => {
        if (open) {
            document.documentElement.setAttribute("data-flow-panel-open", "");
        } else {
            document.documentElement.removeAttribute("data-flow-panel-open");
        }
        return () => {
            document.documentElement.removeAttribute("data-flow-panel-open");
        };
    }, [open]);

    const refresh = () => {
        if (mode === "flow") fetchFlow();
        else fetchActivity();
    };

    // Hide panel on auth pages (must be AFTER all hooks)
    const isAuthPage = pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up") || pathname === "/doctor/login";
    if (isAuthPage) return null;

    /* ── Render ── */

    return (
        <>
            {/* ── Toggle Button ── */}
            <button
                onClick={() => setOpen((prev) => !prev)}
                className={`fixed top-1/2 -translate-y-1/2 z-[60] flex items-center gap-1.5 pl-3 pr-2 py-3 rounded-l-xl
                   bg-sky-500/15 border border-r-0 border-sky-500/30 backdrop-blur-md
                   text-sky-400 hover:bg-sky-500/25 hover:text-sky-300
                   transition-all duration-300 shadow-[0_0_20px_rgba(56,189,248,0.08)]
                   group ${open ? "right-[380px]" : "right-0"}`}
                title="Request Flow Tracker"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block"
                    style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
                    Flow
                </span>
            </button>

            {/* ── Side Panel ── */}
            <div
                className={`fixed top-0 right-0 z-[55] h-full w-[380px]
                    bg-[#0a0f1a]/95 backdrop-blur-xl border-l border-white/[0.07]
                    shadow-[-8px_0_32px_rgba(0,0,0,0.5)]
                    transition-transform duration-300 ease-out flex flex-col
                    ${open ? "translate-x-0" : "translate-x-full"}`}
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_theme(colors.sky.400)] animate-pulse" />
                        <h2 className="text-sm font-bold tracking-tight text-slate-100">
                            {mode === "flow" ? "Request Flows" : "Activity Log"}
                        </h2>
                        <span className="text-[10px] text-slate-600 bg-white/5 border border-white/[0.08] rounded-full px-2 py-0.5">
                            {mode === "flow" ? requests.length : activityLogs.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={refresh} disabled={loading}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-40"
                            title="Refresh">
                            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        <button onClick={() => setOpen(false)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* ── Scrollable Content ── */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 flow-panel-scroll">
                    {mode === "flow" ? (
                        <FlowModeContent
                            requests={requests}
                            loading={loading}
                            expandedId={expandedId}
                            setExpandedId={setExpandedId}
                        />
                    ) : (
                        <ActivityModeContent logs={activityLogs} loading={loading} />
                    )}
                </div>

                {/* ── Bottom Mode Toggle ── */}
                <div className="shrink-0 border-t border-white/[0.07] px-4 py-3 bg-[#080c14]/60 backdrop-blur-md">
                    <div className="flex rounded-xl bg-white/[0.04] border border-white/[0.07] p-1 gap-1">
                        <button
                            onClick={() => setMode("flow")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold tracking-tight transition-all duration-200
                ${mode === "flow"
                                    ? "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.08)]"
                                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                            </svg>
                            Request Flow
                        </button>
                        <button
                            onClick={() => setMode("activity")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold tracking-tight transition-all duration-200
                ${mode === "activity"
                                    ? "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30 shadow-[0_0_12px_rgba(139,92,246,0.08)]"
                                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Activity Log
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ──────────────────────────────────────────────────────────────────────────
   MODE 1 — Request Flow (grouped by request, with expandable flow diagrams)
   ────────────────────────────────────────────────────────────────────────── */

function FlowModeContent({
    requests,
    loading,
    expandedId,
    setExpandedId,
}: {
    requests: RequestItem[];
    loading: boolean;
    expandedId: string | null;
    setExpandedId: (id: string | null) => void;
}) {
    if (loading && requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-6 h-6 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
                <p className="text-xs text-slate-500">Loading requests…</p>
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-600">
                <span className="text-3xl">📋</span>
                <p className="text-sm font-semibold text-slate-500">No requests yet</p>
                <p className="text-xs text-center px-6">Submit a request to see its flow here</p>
            </div>
        );
    }

    return (
        <>
            {requests.map((req) => {
                const isExpanded = expandedId === req.id;
                const badge = STATUS_COLOR[req.status] ?? "bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/30";
                const icon = TYPE_ICON[req.type] ?? "📋";

                return (
                    <div
                        key={req.id}
                        className={`rounded-xl border transition-all duration-200 overflow-hidden ${isExpanded
                            ? "bg-white/[0.04] border-sky-500/20 shadow-[0_0_20px_rgba(56,189,248,0.05)]"
                            : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                            }`}
                    >
                        <button
                            onClick={() => setExpandedId(isExpanded ? null : req.id)}
                            className="w-full text-left px-4 py-3 flex items-center gap-3 group"
                        >
                            <span className="text-lg shrink-0">{icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                                    {req.title}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`inline-flex text-[9px] font-bold uppercase tracking-wider px-1.5 py-[1px] rounded-full ${badge}`}>
                                        {req.status.replace("_", " ")}
                                    </span>
                                    <span className="text-[10px] text-slate-600">
                                        {req.logs.length} step{req.logs.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                            </div>
                            <svg
                                className={`w-4 h-4 text-slate-600 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isExpanded && (
                            <div className="px-4 pb-4 pt-1 border-t border-white/[0.05]">
                                <div className="flex items-center gap-3 mb-3 text-[10px] text-slate-500">
                                    {req.department && (
                                        <span className="flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                                            {req.department}
                                        </span>
                                    )}
                                    {req.doctorName && (
                                        <span className="flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                                            {req.doctorName}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                                        {new Date(req.createdAt).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </span>
                                </div>
                                <FlowDiagram logs={req.logs} />
                            </div>
                        )}
                    </div>
                );
            })}
        </>
    );
}

/* ──────────────────────────────────────────────────────────────────────────
   MODE 2 — Activity Log (chronological list of ALL backend interactions)
   ────────────────────────────────────────────────────────────────────────── */

/* ── Helpers for activity log ── */

const DEPT_BADGE: Record<string, string> = {
    EMERGENCY: "bg-rose-500/20 text-rose-400",
    LABORATORY: "bg-teal-500/20 text-teal-400",
    CARDIOLOGY: "bg-sky-500/20 text-sky-400",
    PHARMACY: "bg-emerald-500/20 text-emerald-400",
    RECEPTION: "bg-amber-500/20 text-amber-400",
    NEUROLOGY: "bg-purple-500/20 text-purple-400",
    RADIOLOGY: "bg-violet-500/20 text-violet-400",
};

function deptBadgeClass(dept: string) {
    return DEPT_BADGE[dept.toUpperCase()] ?? "bg-slate-500/20 text-slate-400";
}

function formatTimestamp(iso: string) {
    const d = new Date(iso);
    return (
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
        " · " +
        d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })
    );
}

function statusIcon(status: string) {
    if (status === "COMPLETED") return "✓";
    if (status === "IN_PROGRESS") return "⟳";
    return "○";
}

function statusTextClass(status: string) {
    if (status === "COMPLETED") return "text-teal-400";
    if (status === "IN_PROGRESS") return "text-sky-400";
    return "text-slate-500";
}

function ActivityModeContent({
    logs,
    loading,
}: {
    logs: ActivityLogEntry[];
    loading: boolean;
}) {
    if (loading && logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-6 h-6 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                <p className="text-xs text-slate-500">Loading activity…</p>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-600">
                <span className="text-3xl">🕐</span>
                <p className="text-sm font-semibold text-slate-500">No activity yet</p>
                <p className="text-xs text-center px-6">All your backend interactions will appear here</p>
            </div>
        );
    }

    return (
        <div className="font-mono text-[11px] leading-relaxed space-y-0.5">
            {logs.map((log, i) => {
                const stIcon = statusIcon(log.status);
                const stClass = statusTextClass(log.status);
                const icon = TYPE_ICON[log.request.type] ?? "📋";
                const ts = formatTimestamp(log.createdAt);
                const method = log.action.toLowerCase().includes("created") || log.action.toLowerCase().includes("submitted") || log.action.toLowerCase().includes("booked")
                    ? "POST" : log.action.toLowerCase().includes("assigned") || log.action.toLowerCase().includes("approved") || log.action.toLowerCase().includes("updated")
                        ? "PUT" : "GET";
                const route = `/${log.request.type.toLowerCase()}/${log.request.id.slice(-8)}`;
                const statusCode = log.status === "COMPLETED" ? "200" : log.status === "IN_PROGRESS" ? "202" : "102";

                return (
                    <div
                        key={log.id}
                        className={`rounded-lg border bg-white/[0.02] px-3 py-2 mb-1.5 flow-node-enter ${log.status === "IN_PROGRESS" ? "border-sky-500/20" : log.status === "COMPLETED" ? "border-teal-500/15" : "border-white/[0.06]"}`}
                        style={{ animationDelay: `${i * 30}ms` }}
                    >
                        {/* Top line: terminal-style log */}
                        <div className="flex items-start gap-1.5 mb-1">
                            <span className={`${stClass} font-bold shrink-0`}>{stIcon}</span>
                            <div className="flex-1 min-w-0">
                                <span className="text-violet-400 font-bold">{method}</span>
                                <span className="text-slate-300 ml-1.5">{route}</span>
                                <span className={`ml-1.5 font-bold ${statusCode === "200" ? "text-emerald-400" : statusCode === "202" ? "text-sky-400" : "text-amber-400"}`}>{statusCode}</span>
                            </div>
                        </div>

                        {/* Action description */}
                        <div className="pl-4 mb-1">
                            <span className="text-slate-400">{icon} </span>
                            <span className={`${log.status === "PENDING" ? "text-slate-500 italic" : "text-slate-300"}`}>
                                {log.action}
                            </span>
                        </div>

                        {/* Detail line: request + dept + performer + timestamp */}
                        <div className="pl-4 flex items-center gap-2 flex-wrap text-[10px]">
                            <span className="text-slate-500 truncate max-w-[140px]" title={log.request.title}>
                                {log.request.title}
                            </span>
                            <span className={`inline-flex font-bold uppercase tracking-wider px-1.5 py-[1px] rounded ${deptBadgeClass(log.department)}`}>
                                {log.department}
                            </span>
                            {log.performedBy && (
                                <span className="text-slate-600 truncate max-w-[100px]" title={log.performedBy}>
                                    by {log.performedBy}
                                </span>
                            )}
                            <span className="text-slate-600 ml-auto shrink-0">{ts}</span>
                        </div>

                        {/* Priority pill */}
                        <div className="pl-4 mt-1 flex items-center gap-2 text-[10px]">
                            <span className={`px-1.5 py-[1px] rounded font-bold uppercase tracking-wider ${log.request.priority === "CRITICAL" ? "bg-rose-500/15 text-rose-400" :
                                log.request.priority === "HIGH" ? "bg-amber-500/15 text-amber-400" :
                                    log.request.priority === "MEDIUM" ? "bg-sky-500/15 text-sky-400" :
                                        "bg-slate-500/15 text-slate-400"
                                }`}>
                                {log.request.priority}
                            </span>
                            <span className={`px-1.5 py-[1px] rounded font-bold uppercase tracking-wider ${STATUS_COLOR[log.request.status] ?? "bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/30"}`}>
                                {log.request.status.replace("_", " ")}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
