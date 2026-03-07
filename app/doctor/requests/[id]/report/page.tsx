import DoctorReportPanel from "../../../_components/DoctorReportPanel";

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white">

      {/* Page Header */}
      <div className="border-b border-white/10 px-8 py-5">
        <h1 className="text-xl font-bold tracking-tight">
          Medical Report
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Create and manage patient prescription reports
        </p>
      </div>

      {/* Main Content */}
      <div className="p-8">
        <DoctorReportPanel
          requestId=""
          doctorName=""
          doctorDepartment=""
          patientEmail=""
          initialReport={null}
        />
      </div>

    </div>
  );
}