import type { RequestLog, LogStatus } from "@prisma/client";

const DEPT_COLORS: Record<string, string> = {
  EMERGENCY:       "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40",
  LABORATORY:      "bg-teal-500/20 text-teal-400 ring-1 ring-teal-500/40",
  RADIOLOGY:       "bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/40",
  CARDIOLOGY:      "bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/40",
  PHARMACY:        "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40",
  RECEPTION:       "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40",
  GENERAL:         "bg-slate-500/20 text-slate-400 ring-1 ring-slate-500/40",
};

function deptColor(dept: string) {
  return DEPT_COLORS[dept.toUpperCase()] ?? "bg-slate-500/20 text-slate-400 ring-1 ring-slate-500/40";
}

function StatusIcon({ status }: { status: LogStatus }) {
  if (status === "COMPLETED") {
    return (
      <div className="w-7 h-7 rounded-full bg-teal-500/20 ring-2 ring-teal-400 flex items-center justify-center shrink-0 z-10">
        <svg className="w-3.5 h-3.5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  if (status === "IN_PROGRESS") {
    return (
      <div className="w-7 h-7 rounded-full bg-sky-500/20 ring-2 ring-sky-400 flex items-center justify-center shrink-0 z-10">
        <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
      </div>
    );
  }

  // PENDING
  return (
    <div className="w-7 h-7 rounded-full bg-white/5 ring-2 ring-white/20 flex items-center justify-center shrink-0 z-10" />
  );
}

// ── component ──────────────────────────────────────────────────────────────

interface Props {
  logs: RequestLog[];
}

export default function ActivityTimeline({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-600">
        <span className="text-3xl">🕐</span>
        <p className="text-sm font-semibold text-slate-500">No activity yet</p>
        <p className="text-xs">Timeline will appear once staff take action</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {logs.map((log, index) => {
        const isLast = index === logs.length - 1;
        const isPending = log.status === "PENDING";

        return (
          <div key={log.id} className="flex gap-4 relative">

            {/* Left — icon + vertical line */}
            <div className="flex flex-col items-center">
              <StatusIcon status={log.status} />
              {!isLast && (
                <div className="w-px flex-1 bg-white/[0.08] mt-1 mb-0 min-h-[2rem]" />
              )}
            </div>

            {/* Right — content */}
            <div className={`pb-6 flex-1 min-w-0 ${isLast ? "pb-2" : ""}`}>
              {/* Department badge */}
              <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded mb-1.5 ${deptColor(log.department)}`}>
                {log.department}
              </span>

              {/* Action text */}
              <p className={`text-sm font-semibold leading-snug ${isPending ? "text-slate-500 italic" : "text-slate-200"}`}>
                {log.action}
              </p>

              {/* Meta — doctor + time */}
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {log.performedBy ? (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {log.performedBy}
                  </span>
                ) : null}

                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {isPending
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