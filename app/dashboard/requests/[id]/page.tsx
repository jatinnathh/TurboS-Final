import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import ActivityTimeline from "../../_components/ActivityTimeline";
import PatientReportPanel from "./PatientReportPanel";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30",
    APPROVED: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30",
    REJECTED: "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30",
    IN_PROGRESS: "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30",
    COMPLETED: "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/30",
  };
  return (
    map[status] ??
    "bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/30"
  );
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

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ Next.js 15 fix — params is a Promise
  const { id } = await params;

  const user_clerk = await currentUser();
  if (!user_clerk) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: user_clerk.id },
  });

  if (!user || user.role !== "USER") redirect("/");

  if (!id || typeof id !== "string") {
    notFound();
  }

  const request = await prisma.request.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      doctor: true,
      logs: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!request) notFound();

  // Fetch doctor report
  const rawReport = await prisma.doctorReport.findUnique({
    where: { requestId: id },
  });

  const reportData = rawReport
    ? {
      patientName: rawReport.patientName,
      date: rawReport.date,
      age: rawReport.age ?? "",
      gender: rawReport.gender ?? "",
      vitalsBp: rawReport.vitalsBp ?? "",
      vitalsPulse: rawReport.vitalsPulse ?? "",
      vitalsTemp: rawReport.vitalsTemp ?? "",
      vitalsWeight: rawReport.vitalsWeight ?? "",
      symptoms: rawReport.symptoms ? JSON.parse(rawReport.symptoms) : [],
      diagnosis: rawReport.diagnosis ?? "",
      medications: rawReport.medications ? JSON.parse(rawReport.medications) : [],
      advice: rawReport.advice ?? "",
      nextVisit: rawReport.nextVisit ?? "",
    }
    : null;

  const p = priorityConfig(request.priority);

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
              avatarBox:
                "w-8 h-8 ring-2 ring-white/10 hover:ring-sky-400/50 transition-all rounded-full",
            },
          }}
        />
      </nav>

      <div className="max-w-7xl mx-auto px-5 md:px-8 py-10">

        {/* Two-column layout: Report | Main Content */}
        <div className="grid grid-cols-[240px_1fr] gap-8">

          {/* Left: Report Panel */}
          <div className="sticky top-24 self-start">
            <PatientReportPanel
              doctorName={request.doctorName ?? request.doctor?.name ?? "Doctor"}
              doctorDepartment={request.department ?? ""}
              report={reportData}
            />
          </div>

          {/* Right: Main Content */}
          <div className="space-y-8">
            {/* Back */}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Dashboard
            </Link>

            {/* Request Header Card */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">
                    Request
                  </p>
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-100">
                    {request.title}
                  </h1>
                </div>
                <span
                  className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${statusBadge(
                    request.status
                  )}`}
                >
                  {request.status.replace("_", " ")}
                </span>
              </div>

              {request.description && (
                <p className="text-sm text-slate-400 leading-relaxed">
                  {request.description}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {[
                  {
                    label: "Type",
                    value: request.type
                      .split("_")
                      .map((w) => w[0] + w.slice(1).toLowerCase())
                      .join(" "),
                  },
                  { label: "Department", value: request.department ?? "—" },
                  { label: "Doctor", value: request.doctorName ?? "—" },
                  {
                    label: "Priority",
                    value: request.priority,
                    custom: (
                      <div
                        className={`flex items-center gap-1.5 text-xs font-semibold ${p.text}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${p.dot}`}
                        />
                        {request.priority}
                      </div>
                    ),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-white/[0.03] rounded-xl px-4 py-3"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">
                      {item.label}
                    </p>
                    {item.custom ?? (
                      <p className="text-xs font-semibold text-slate-300">
                        {item.value}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Card */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <svg
                  className="w-4 h-4 text-sky-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <h2 className="text-sm font-bold tracking-tight text-slate-200">
                  Activity Timeline
                </h2>
                <span className="ml-auto text-xs text-slate-600 bg-white/5 border border-white/[0.08] rounded-full px-2.5 py-0.5">
                  {request.logs.length} events
                </span>
              </div>

              <ActivityTimeline logs={request.logs} />
            </div>

          </div>{/* end right column */}
        </div>{/* end grid */}
      </div>
    </div>
  );
}