import { getDoctorFromToken } from "@/lib/doctorAuth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ChatLayout from "./ChatLayout";
import ChatBadge from "../_components/ChatBadge";

export default async function ChatPage() {
    const doctor = await getDoctorFromToken();
    if (!doctor) redirect("/doctor/login");

    // Get all unique departments (excluding this doctor's)
    const doctors = await prisma.doctor.findMany({
        select: { department: true },
    });

    const allDepartments = [
        ...new Set(doctors.map((d) => d.department)),
    ].filter((dep) => dep !== doctor.department);

    return (
        <div className="min-h-screen bg-[#080c14] text-slate-200 font-sans">
            {/* ── Navbar ── */}
            <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 border-b border-white/5 bg-[#080c14]/80 backdrop-blur-md">
                <div className="flex items-center gap-2.5 text-slate-100 font-bold tracking-tight">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_theme(colors.emerald.400)] animate-pulse" />
                    MediFlow
                    <span className="ml-1.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-400/70 bg-emerald-400/10 px-2 py-0.5 rounded-full ring-1 ring-emerald-400/20">
                        Doctor
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <ChatBadge />
                    <a
                        href="/doctor/dashboard"
                        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Dashboard
                    </a>
                </div>
            </nav>

            <ChatLayout
                doctorId={doctor.id}
                doctorName={doctor.name}
                doctorDepartment={doctor.department}
                departments={allDepartments}
            />
        </div>
    );
}
