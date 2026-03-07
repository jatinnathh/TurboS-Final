import { prisma } from "@/lib/prisma";
import { getDoctorFromToken } from "@/lib/doctorAuth";
import { redirect } from "next/navigation";
import PublishResultForm from "./publishform";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

function labStatusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING:     "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30",
    IN_PROGRESS: "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30",
    COMPLETED:   "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30",
  };
  return map[status] ?? "bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/30";
}

export default async function LabTestPage({ params }: Props) {
  const doctor = await getDoctorFromToken();
  if (!doctor) redirect("/doctor/login");

  const { id } = await params;

  const test = await prisma.labTest.findUnique({
    where: { id },
    include: { request: true },
  });

  if (!test || test.labDoctorId !== doctor.id)
    redirect("/doctor/dashboard");

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
        <Link
          href="/doctor/dashboard"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-5 md:px-8 py-10 space-y-8">

        {/* ── Header Card ── */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">
                Lab Test
              </p>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
                <span>🧪</span>
                {test.testType}
              </h1>
            </div>
            <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${labStatusBadge(test.status)}`}>
              {test.status.replace("_", " ")}
            </span>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-white/[0.03] rounded-xl px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Department</p>
              <p className="text-sm font-semibold text-slate-300">{test.department}</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Status</p>
              <p className="text-sm font-semibold text-slate-300">{test.status.replace("_", " ")}</p>
            </div>
          </div>
        </div>

        {/* ── Publish Result Form ── */}
        {test.status !== "COMPLETED" && (
          <PublishResultForm labTestId={test.id} />
        )}

        {/* ── Result Card ── */}
        {test.result && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 ring-2 ring-emerald-400 flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest">
                Published Result
              </h3>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed pl-8">
              {test.result}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}