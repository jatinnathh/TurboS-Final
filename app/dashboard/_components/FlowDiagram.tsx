"use client";

interface LogEntry {
    id: string;
    department: string;
    action: string;
    performedBy: string | null;
    status: "COMPLETED" | "IN_PROGRESS" | "PENDING";
    createdAt: string;
}

interface Props {
    logs: LogEntry[];
}

const STATUS_STYLES: Record<string, { node: string; ring: string; line: string; icon: string }> = {
    COMPLETED: {
        node: "bg-teal-500/15 border-teal-500/40",
        ring: "bg-teal-500/20 ring-2 ring-teal-400",
        line: "bg-teal-500/30",
        icon: "text-teal-400",
    },
    IN_PROGRESS: {
        node: "bg-sky-500/15 border-sky-500/40",
        ring: "bg-sky-500/20 ring-2 ring-sky-400",
        line: "bg-sky-500/30",
        icon: "text-sky-400",
    },
    PENDING: {
        node: "bg-white/[0.04] border-white/10",
        ring: "bg-white/5 ring-2 ring-white/20",
        line: "bg-white/10",
        icon: "text-slate-500",
    },
};

const DEPT_COLORS: Record<string, string> = {
    EMERGENCY: "bg-rose-500/20 text-rose-400",
    LABORATORY: "bg-teal-500/20 text-teal-400",
    RADIOLOGY: "bg-violet-500/20 text-violet-400",
    CARDIOLOGY: "bg-sky-500/20 text-sky-400",
    PHARMACY: "bg-emerald-500/20 text-emerald-400",
    RECEPTION: "bg-amber-500/20 text-amber-400",
    NEUROLOGY: "bg-purple-500/20 text-purple-400",
    GENERAL: "bg-slate-500/20 text-slate-400",
};

function deptBadge(dept: string) {
    return DEPT_COLORS[dept.toUpperCase()] ?? "bg-slate-500/20 text-slate-400";
}

export default function FlowDiagram({ logs }: Props) {
    if (logs.length === 0) {
        return (
            <div className="flex items-center justify-center py-4 text-xs text-slate-600">
                No activity yet
            </div>
        );
    }

    return (
        <div className="relative pl-4">
            {logs.map((log, i) => {
                const s = STATUS_STYLES[log.status] ?? STATUS_STYLES.PENDING;
                const isLast = i === logs.length - 1;

                return (
                    <div key={log.id} className="relative flex gap-3 pb-1">
                        {/* Vertical connector line */}
                        {!isLast && (
                            <div
                                className={`absolute left-[11px] top-[24px] w-[2px] bottom-0 ${s.line} flow-line-animate`}
                            />
                        )}

                        {/* Node dot */}
                        <div className="relative z-10 mt-[2px] shrink-0">
                            <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center ${s.ring}`}>
                                {log.status === "COMPLETED" ? (
                                    <svg className={`w-3 h-3 ${s.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : log.status === "IN_PROGRESS" ? (
                                    <div className="w-2 h-2 rounded-full bg-sky-400 flow-node-pulse" />
                                ) : (
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className={`flex-1 min-w-0 rounded-lg border px-3 py-2 mb-2 ${s.node} flow-node-enter`} style={{ animationDelay: `${i * 80}ms` }}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`inline-flex text-[9px] font-bold uppercase tracking-widest px-1.5 py-[1px] rounded ${deptBadge(log.department)}`}>
                                    {log.department}
                                </span>
                            </div>
                            <p className={`text-xs font-medium leading-snug ${log.status === "PENDING" ? "text-slate-500 italic" : "text-slate-300"}`}>
                                {log.action}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                {log.performedBy && (
                                    <span className="text-[10px] text-slate-500">{log.performedBy}</span>
                                )}
                                <span className="text-[10px] text-slate-600">
                                    {log.status === "PENDING"
                                        ? "Pending"
                                        : new Date(log.createdAt).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        }) +
                                        " · " +
                                        new Date(log.createdAt).toLocaleTimeString("en-US", {
                                            hour: "numeric",
                                            minute: "2-digit",
                                            hour12: true,
                                        })}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
