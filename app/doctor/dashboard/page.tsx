import { getDoctorFromToken } from "@/lib/doctorAuth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ChatBadge from "../_components/ChatBadge";
import GeminiConsult from "../_components/GeminiConsult"; // ✅ added

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30",
    APPROVED: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30",
    REJECTED: "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30",
    IN_PROGRESS: "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30",
    COMPLETED: "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/30",
  };
  return map[status] ?? "bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/30";
}

function labStatusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30",
    IN_PROGRESS: "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30",
    COMPLETED: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30",
  };
  return map[status];
}

function priorityDot(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-400",
    IN_PROGRESS: "bg-sky-400",
    COMPLETED: "bg-violet-400",
    APPROVED: "bg-emerald-400",
    REJECTED: "bg-rose-400",
  };
  return map[status] ?? "bg-slate-400";
}

export default async function DoctorDashboard() {
  const doctor = await getDoctorFromToken();
  if (!doctor) redirect("/doctor/login");

  const requests = await prisma.request.findMany({
    where: {
      OR: [
        { doctorId: doctor.id },
        { logs: { some: { performedBy: doctor.name } } },
      ],
    },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  const labTests = await prisma.labTest.findMany({
    where: { labDoctorId: doctor.id },
    include: { request: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });

  const activeCases = requests.filter((r) => r.doctorId === doctor.id && r.status !== "COMPLETED");
  const completedCases = requests.filter((r) => r.status === "COMPLETED");
  const referredCases = requests.filter((r) => r.doctorId !== doctor.id && r.status !== "COMPLETED");
  const pendingLabTests = labTests.filter((t) => t.status !== "COMPLETED");

  const stats = [
    { label: "Active Cases", value: activeCases.length, color: "text-emerald-400", sub: "Currently assigned" },
    { label: "Referred Cases", value: referredCases.length, color: "text-amber-400", sub: "Referred to others" },
    { label: "Completed Cases", value: completedCases.length, color: "text-violet-400", sub: "Successfully closed" },
    { label: "Pending Lab Tests", value: pendingLabTests.length, color: "text-sky-400", sub: "Awaiting results" },
  ];

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 font-sans">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 border-b border-white/5 bg-[#080c14]/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5 text-slate-100 font-bold tracking-tight">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          MediFlow
          <span className="ml-1.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-400/70 bg-emerald-400/10 px-2 py-0.5 rounded-full ring-1 ring-emerald-400/20">
            Doctor
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ChatBadge />
          <form action="/api/doctor/logout" method="POST">
            <button className="flex items-center gap-1.5 text-sm text-rose-400 bg-rose-500/10 ring-1 ring-rose-500/30 hover:bg-rose-500/20 px-3 py-1.5 rounded-xl font-semibold">
              Logout
            </button>
          </form>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100">
            Welcome, {doctor.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your patient cases and lab test assignments
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl px-5 py-4">
              <p className="text-[10px] uppercase text-slate-500 mb-2">{s.label}</p>
              <p className={`text-4xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-slate-600 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Patient Cases */}
        <div>
          <p className="text-[10px] uppercase text-slate-500 mb-3">
            Patient Cases
          </p>

          <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">

            {requests.map((req) => (
              <Link
                key={req.id}
                href={`/doctor/requests/${req.id}`}
                className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04] hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${priorityDot(req.status)}`} />
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      {req.user.email}
                    </p>
                    <p className="text-xs text-slate-500">
                      {req.title}
                    </p>
                  </div>
                </div>

                <span className={`text-xs px-2 py-1 rounded ${statusBadge(req.status)}`}>
                  {req.status.replace("_"," ")}
                </span>

              </Link>
            ))}

          </div>
        </div>

        {/* Lab Tests */}
        {labTests.length > 0 && (
          <div>
            <p className="text-[10px] uppercase text-slate-500 mb-3">
              Assigned Lab Tests
            </p>

            <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">

              {labTests.map((test) => (
                <Link
                  key={test.id}
                  href={`/doctor/lab/${test.id}`}
                  className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04] hover:bg-white/[0.04]"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      {test.testType}
                    </p>
                    <p className="text-xs text-slate-500">
                      Patient: {test.request.user.email}
                    </p>
                  </div>

                  <span className={`text-xs px-2 py-1 rounded ${labStatusBadge(test.status)}`}>
                    {test.status.replace("_"," ")}
                  </span>

                </Link>
              ))}

            </div>
          </div>
        )}

        {/* ✅ AI Consultation Section (added only) */}
        <GeminiConsult />

      </div>
    </div>
  );
}