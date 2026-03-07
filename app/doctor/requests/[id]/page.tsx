import { prisma } from "@/lib/prisma";
import { getDoctorFromToken } from "@/lib/doctorAuth";
import { redirect } from "next/navigation";
import ActionButtons from "./ActionButton";
import DoctorReportPanel from "@/app/doctor/_components/DoctorReportPanel";
import Link from "next/link";
import ChatBadge from "../../_components/ChatBadge";
import CancerClassifier from "../../_components/CancerClassifier";

interface PageProps {
  params: Promise<{ id: string }>;
}

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
  if (status === "COMPLETED") return "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30";
  if (status === "IN_PROGRESS") return "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30";
  return "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30";
}

function StatusIcon({ status }: { status: string }) {
  if (status === "COMPLETED") {
    return (
      <div className="w-7 h-7 rounded-full bg-teal-500/20 ring-2 ring-teal-400 flex items-center justify-center shrink-0">
        <svg className="w-3.5 h-3.5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (status === "IN_PROGRESS") {
    return (
      <div className="w-7 h-7 rounded-full bg-sky-500/20 ring-2 ring-sky-400 flex items-center justify-center shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-white/5 ring-2 ring-white/20 flex items-center justify-center shrink-0" />
  );
}

const DEPT_COLORS: Record<string, string> = {
  EMERGENCY: "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40",
  LABORATORY: "bg-teal-500/20 text-teal-400 ring-1 ring-teal-500/40",
  RADIOLOGY: "bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/40",
  CARDIOLOGY: "bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/40",
  PHARMACY: "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40",
  GENERAL: "bg-slate-500/20 text-slate-400 ring-1 ring-slate-500/40",
};

function deptColor(dept: string) {
  return DEPT_COLORS[dept?.toUpperCase()] ?? "bg-slate-500/20 text-slate-400 ring-1 ring-slate-500/40";
}

export default async function RequestDetail({ params }: PageProps) {
  const doctor = await getDoctorFromToken();
  if (!doctor) redirect("/doctor/login");

  const { id } = await params;

  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      user: true,
      logs: { orderBy: { createdAt: "asc" } },
      prescriptions: true,
      labTests: {
        include: { labDoctor: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!request) redirect("/doctor/dashboard");

  // Fetch doctor report
  const rawReport = await prisma.doctorReport.findUnique({
    where: { requestId: id },
  });

  // Parse JSON fields for the panel
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
        symptoms: rawReport.symptoms ? JSON.parse(rawReport.symptoms) : [""],
        diagnosis: rawReport.diagnosis ?? "",
        medications: rawReport.medications
          ? JSON.parse(rawReport.medications)
          : [{ name: "", dosage: "", frequency: "", duration: "" }],
        advice: rawReport.advice ?? "",
        nextVisit: rawReport.nextVisit ?? "",
      }
    : null;

  // Allow access if doctor is currently assigned OR appeared in logs
  const isCurrentDoctor = request.doctorId === doctor.id;
  const appearsInLogs = request.logs.some((l) => l.performedBy === doctor.name);
  if (!isCurrentDoctor && !appearsInLogs) redirect("/doctor/dashboard");

  // Read-only mode: doctor previously handled this case but it was referred away
  const isReadOnly = !isCurrentDoctor;

  const doctors = await prisma.doctor.findMany({
    select: { id: true, name: true, department: true },
  });

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
          <Link
            href="/doctor/dashboard"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-5 md:px-8 py-10">

        {/* ── Two-column layout: Report Panel | Main Content ── */}
        <div className="grid grid-cols-[240px_1fr] gap-8">

          {/* Left: Report Panel — sticky sidebar */}
          <div className="sticky top-24 self-start">
            <DoctorReportPanel
              requestId={id}
              doctorName={request.doctorName ?? doctor.name}
              doctorDepartment={request.department ?? doctor.department}
              patientEmail={request.user.email}
              initialReport={reportData}
            />
          </div>

          {/* Right: Main Content */}
          <div className="space-y-8 min-w-0">

            {/* ── Referred Banner ── */}
            {isReadOnly && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl px-6 py-4 flex items-center gap-3">
                <span className="text-2xl">🔁</span>
                <div>
                  <p className="text-sm font-bold text-amber-400">This case has been referred</p>
                  <p className="text-xs text-amber-400/60 mt-0.5">
                    You can view the history but cannot take any actions on this case.
                  </p>
                </div>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 ring-1 ring-amber-500/30 px-3 py-1 rounded-full shrink-0">
                  Referred
                </span>
              </div>
            )}

            {/* ── Request Header ── */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">
                    Request
                  </p>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-100 truncate">
                    {request.title}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Patient: {request.user.email}
                  </p>
                </div>
                <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shrink-0 ${isReadOnly ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30" : statusBadge(request.status)}`}>
                  {isReadOnly ? "REFERRED" : request.status.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* ── Activity Timeline ── */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <h3 className="text-sm font-bold tracking-tight text-slate-200">Activity Timeline</h3>
                <span className="ml-auto text-xs text-slate-600 bg-white/5 border border-white/[0.08] rounded-full px-2.5 py-0.5">
                  {request.logs.length} events
                </span>
              </div>

              {request.logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <span className="text-3xl">🕐</span>
                  <p className="text-sm font-semibold text-slate-500">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {request.logs.map((log, index) => {
                    const isLast = index === request.logs.length - 1;
                    return (
                      <div key={log.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <StatusIcon status={log.status} />
                          {!isLast && <div className="w-px flex-1 bg-white/[0.08] mt-1 min-h-[2rem]" />}
                        </div>
                        <div className={`flex-1 min-w-0 ${isLast ? "pb-2" : "pb-6"}`}>
                          <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded mb-1.5 ${deptColor(log.department)}`}>
                            {log.department}
                          </span>
                          <p className={`text-sm font-semibold leading-snug ${log.status === "PENDING" ? "text-slate-500 italic" : "text-slate-200"}`}>
                            {log.action}
                          </p>
                          {log.performedBy && (
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              By {log.performedBy}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Prescriptions ── */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-lg">💊</span>
                <h3 className="text-sm font-bold tracking-tight text-slate-200">Prescriptions</h3>
                <span className="ml-auto text-xs text-slate-600 bg-white/5 border border-white/[0.08] rounded-full px-2.5 py-0.5">
                  {request.prescriptions.length} total
                </span>
              </div>

              {request.prescriptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <span className="text-3xl">📋</span>
                  <p className="text-sm font-semibold text-slate-500">No prescriptions added</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {request.prescriptions.map((pres) => (
                    <div key={pres.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <p className="text-sm font-bold text-slate-200">{pres.medication}</p>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-500/30 px-2 py-0.5 rounded-full shrink-0">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {pres.dosage} · {pres.frequency}
                      </p>
                      {pres.notes && (
                        <p className="text-xs text-slate-600 mt-1.5 italic">{pres.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Lab Tests ── */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-lg">🧪</span>
                <h3 className="text-sm font-bold tracking-tight text-slate-200">Lab Tests</h3>
                <span className="ml-auto text-xs text-slate-600 bg-white/5 border border-white/[0.08] rounded-full px-2.5 py-0.5">
                  {request.labTests.length} total
                </span>
              </div>

              {request.labTests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <span className="text-3xl">🔬</span>
                  <p className="text-sm font-semibold text-slate-500">No lab tests ordered</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {request.labTests.map((test) => (
                    <div key={test.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-4 space-y-3">

                      {/* Test header */}
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="space-y-1 min-w-0">
                          <p className="text-sm font-bold text-slate-200">{test.testType}</p>
                          <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${deptColor(test.department)}`}>
                            {test.department}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ${labStatusBadge(test.status)}`}>
                          {test.status.replace("_", " ")}
                        </span>
                      </div>

                      {/* Lab doctor */}
                      {test.labDoctor && (
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Lab Doctor: {test.labDoctor.name}
                        </p>
                      )}

                      {/* Result */}
                      {test.result && (
                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400 mb-1.5">
                            Result
                          </p>
                          <p className="text-sm text-slate-200">{test.result}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Cancer Classifier ── */}
            {!isReadOnly && <CancerClassifier />}

            {/* ── Action Buttons (active cases only) ── */}
            {!isReadOnly && request.status !== "COMPLETED" && (
              <ActionButtons requestId={request.id} doctors={doctors} />
            )}

          </div>{/* end right column */}
        </div>{/* end grid */}
      </div>
    </div>
  );
}