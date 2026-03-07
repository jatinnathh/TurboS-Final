import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

const STATUS_STEPS = ["Registered", "Under Review", "In Treatment", "Completed"];

function getStepIndex(status: string) {
    const map: Record<string, number> = {
        PENDING: 0,
        APPROVED: 1,
        IN_PROGRESS: 2,
        COMPLETED: 3,
        REJECTED: -1,
    };
    return map[status] ?? 0;
}

function typeIcon(type: string) {
    const map: Record<string, string> = {
        APPOINTMENT: "🗓",
        LAB_TEST: "🧪",
        EMERGENCY: "🚨",
        PRESCRIPTION: "💊",
        ROOM_BOOKING: "🛏",
        REPORT_DOWNLOAD: "📄",
    };
    return map[type] ?? "📋";
}

function priorityConfig(priority: string) {
    const map: Record<string, { dot: string; text: string }> = {
        LOW: { dot: "bg-slate-400", text: "text-slate-400" },
        MEDIUM: { dot: "bg-amber-400", text: "text-amber-400" },
        HIGH: { dot: "bg-orange-400", text: "text-orange-400" },
        CRITICAL: { dot: "bg-rose-400", text: "text-rose-400" },
    };
    return map[priority] ?? { dot: "bg-slate-400", text: "text-slate-400" };
}

export default async function HealthStatusPage() {
    const user_clerk = await currentUser();
    if (!user_clerk) redirect("/sign-in");

    const user = await prisma.user.findUnique({ where: { clerkId: user_clerk.id } });
    if (!user || user.role !== "USER") redirect("/");

    const requests = await prisma.request.findMany({
        where: { userId: user.id },
        include: {
            logs: { orderBy: { createdAt: "desc" }, take: 1 },
            doctor: true,
        },
        orderBy: { updatedAt: "desc" },
    });

    const activeRequests = requests.filter((r) => ["PENDING", "APPROVED", "IN_PROGRESS"].includes(r.status));
    const pastRequests = requests.filter((r) => ["COMPLETED", "REJECTED"].includes(r.status));

    return (
        <div className="min-h-screen bg-[#080c14] text-slate-200 font-sans">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 border-b border-white/5 bg-[#080c14]/80 backdrop-blur-md">
                <div className="flex items-center gap-2.5 text-slate-100 font-bold tracking-tight">
                    <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_theme(colors.sky.400)] animate-pulse" />
                    MediFlow
                </div>
                <UserButton

                    appearance={{
                        elements: {
                            avatarBox: "w-8 h-8 ring-2 ring-white/10 hover:ring-sky-400/50 transition-all rounded-full",
                        },
                    }}
                />
            </nav>

            <div className="max-w-4xl mx-auto px-5 md:px-8 py-10 space-y-8">
                {/* Back */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                </Link>

                {/* Header */}
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-3xl">🩺</span>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tighter text-slate-100">
                            Health Status
                        </h1>
                    </div>
                    <p className="text-sm text-slate-500 font-light">
                        Track the current status of your health checkups and medical requests
                    </p>
                </div>

                {/* Active Checkups */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                            Active Checkups
                        </p>
                        <span className="text-xs text-slate-500 bg-white/5 border border-white/[0.08] rounded-full px-3 py-0.5">
                            {activeRequests.length} active
                        </span>
                    </div>

                    {activeRequests.length === 0 ? (
                        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl flex flex-col items-center justify-center py-16 gap-3">
                            <span className="text-4xl">✅</span>
                            <p className="text-sm font-bold text-slate-500 tracking-tight">No active checkups</p>
                            <p className="text-xs text-slate-600">All your requests have been completed</p>
                        </div>
                    ) : (
                        activeRequests.map((req) => {
                            const stepIdx = getStepIndex(req.status);
                            const p = priorityConfig(req.priority);
                            const latestLog = req.logs[0];

                            return (
                                <Link
                                    key={req.id}
                                    href={`/dashboard/requests/${req.id}`}
                                    className="block bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.12] transition-all group"
                                >
                                    {/* Top row */}
                                    <div className="flex items-start justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="text-2xl shrink-0">{typeIcon(req.type)}</span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                                                    {req.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-slate-500">{req.department ?? "—"}</span>
                                                    {req.doctor && (
                                                        <>
                                                            <span className="text-slate-700">•</span>
                                                            <span className="text-xs text-slate-500">{req.doctor.name}</span>
                                                        </>
                                                    )}
                                                    {req.doctorName && !req.doctor && (
                                                        <>
                                                            <span className="text-slate-700">•</span>
                                                            <span className="text-xs text-slate-500">{req.doctorName}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-1.5 text-xs font-medium ${p.text} shrink-0`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                                            {req.priority}
                                        </div>
                                    </div>

                                    {/* Progress stepper */}
                                    <div className="flex items-center gap-0 mb-3">
                                        {STATUS_STEPS.map((step, i) => {
                                            const isCompleted = i <= stepIdx;
                                            const isCurrent = i === stepIdx;
                                            return (
                                                <div key={step} className="flex items-center flex-1 last:flex-none">
                                                    <div className="flex flex-col items-center">
                                                        <div
                                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${isCompleted
                                                                    ? isCurrent
                                                                        ? "bg-sky-500/20 ring-2 ring-sky-400 text-sky-400"
                                                                        : "bg-teal-500/20 ring-2 ring-teal-400 text-teal-400"
                                                                    : "bg-white/5 ring-2 ring-white/20 text-slate-600"
                                                                }`}
                                                        >
                                                            {isCompleted && !isCurrent ? (
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            ) : isCurrent ? (
                                                                <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                                                            ) : (
                                                                i + 1
                                                            )}
                                                        </div>
                                                        <p className={`text-[9px] font-semibold mt-1 ${isCompleted ? (isCurrent ? "text-sky-400" : "text-teal-400") : "text-slate-600"}`}>
                                                            {step}
                                                        </p>
                                                    </div>
                                                    {i < STATUS_STEPS.length - 1 && (
                                                        <div
                                                            className={`flex-1 h-px mx-1 ${i < stepIdx ? "bg-teal-400/40" : "bg-white/[0.08]"}`}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Latest activity */}
                                    {latestLog && (
                                        <div className="bg-white/[0.03] rounded-xl px-3 py-2 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
                                            <p className="text-xs text-slate-400 truncate">
                                                <span className="text-slate-500">{latestLog.department}</span>
                                                {" — "}{latestLog.action}
                                            </p>
                                            <span className="ml-auto text-[10px] text-slate-600 shrink-0">
                                                {new Date(latestLog.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                            </span>
                                        </div>
                                    )}
                                </Link>
                            );
                        })
                    )}
                </div>

                {/* Past Checkups */}
                {pastRequests.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                            Past Checkups
                        </p>
                        <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
                            {pastRequests.map((req) => (
                                <Link
                                    key={req.id}
                                    href={`/dashboard/requests/${req.id}`}
                                    className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.04] transition-colors group"
                                >
                                    <span className="text-lg shrink-0">{typeIcon(req.type)}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-400 truncate group-hover:text-slate-300 transition-colors">
                                            {req.title}
                                        </p>
                                        <p className="text-xs text-slate-600">{req.department ?? "—"}</p>
                                    </div>
                                    <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${req.status === "COMPLETED"
                                            ? "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/30"
                                            : "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30"
                                        }`}>
                                        {req.status}
                                    </span>
                                    <span className="text-xs text-slate-600 shrink-0">
                                        {new Date(req.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
