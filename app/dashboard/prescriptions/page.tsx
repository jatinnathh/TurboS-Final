import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

export default async function PrescriptionsPage() {
    const user_clerk = await currentUser();
    if (!user_clerk) redirect("/sign-in");

    const user = await prisma.user.findUnique({ where: { clerkId: user_clerk.id } });
    if (!user || user.role !== "USER") redirect("/");

    const prescriptions = await prisma.prescription.findMany({
        where: { userId: user.id },
        include: { doctor: true },
        orderBy: { createdAt: "desc" },
    });

    const now = new Date();

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
                        <span className="text-3xl">💊</span>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tighter text-slate-100">
                            My Prescriptions
                        </h1>
                    </div>
                    <p className="text-sm text-slate-500 font-light">
                        View all medications prescribed to you by your doctors
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl px-5 py-4">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">Total</p>
                        <p className="text-3xl font-extrabold tracking-tighter text-slate-100">{prescriptions.length}</p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl px-5 py-4">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">Active</p>
                        <p className="text-3xl font-extrabold tracking-tighter text-emerald-400">
                            {prescriptions.filter((p) => !p.endDate || new Date(p.endDate) >= now).length}
                        </p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl px-5 py-4">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">Expired</p>
                        <p className="text-3xl font-extrabold tracking-tighter text-slate-500">
                            {prescriptions.filter((p) => p.endDate && new Date(p.endDate) < now).length}
                        </p>
                    </div>
                </div>

                {/* Prescriptions Grid */}
                {prescriptions.length === 0 ? (
                    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl flex flex-col items-center justify-center py-20 gap-3">
                        <span className="text-4xl">💊</span>
                        <p className="text-sm font-bold text-slate-500 tracking-tight">No prescriptions yet</p>
                        <p className="text-xs text-slate-600">Prescriptions from your doctors will appear here</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {prescriptions.map((rx) => {
                            const isActive = !rx.endDate || new Date(rx.endDate) >= now;
                            return (
                                <div
                                    key={rx.id}
                                    className={`bg-white/[0.03] border rounded-2xl p-5 space-y-4 transition-all ${isActive
                                            ? "border-emerald-500/20 hover:border-emerald-500/40"
                                            : "border-white/[0.07] opacity-60"
                                        }`}
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? "bg-emerald-500/10" : "bg-white/5"
                                                }`}>
                                                <span className="text-xl">💊</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`text-sm font-bold truncate ${isActive ? "text-slate-100" : "text-slate-400"}`}>
                                                    {rx.medication}
                                                </p>
                                                <p className="text-xs text-slate-500">{rx.dosage}</p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ${isActive
                                                ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30"
                                                : "bg-slate-500/10 text-slate-500 ring-1 ring-slate-500/30"
                                            }`}>
                                            {isActive ? "Active" : "Expired"}
                                        </span>
                                    </div>

                                    {/* Details grid */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-white/[0.03] rounded-xl px-3 py-2">
                                            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-0.5">Frequency</p>
                                            <p className="text-xs font-semibold text-slate-300">{rx.frequency}</p>
                                        </div>
                                        <div className="bg-white/[0.03] rounded-xl px-3 py-2">
                                            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-0.5">Duration</p>
                                            <p className="text-xs font-semibold text-slate-300">
                                                {new Date(rx.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                {" — "}
                                                {rx.endDate
                                                    ? new Date(rx.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                                    : "Ongoing"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Doctor */}
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400 text-[10px] font-bold shrink-0">
                                            {rx.doctor.name.split(" ").slice(-1)[0][0]}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-slate-300 truncate">{rx.doctor.name}</p>
                                            <p className="text-[10px] text-slate-500 truncate">{rx.doctor.specialization}</p>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {rx.notes && (
                                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl px-3 py-2">
                                            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-500/60 mb-0.5">Note</p>
                                            <p className="text-xs text-amber-200/70">{rx.notes}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
