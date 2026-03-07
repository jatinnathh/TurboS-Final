"use client";

import { useState } from "react";
import { generatePrintHTML } from "@/lib/generatePrintHTML";

interface Medication {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
}

interface ReportData {
    patientName: string;
    date: string;
    age: string;
    gender: string;
    vitalsBp: string;
    vitalsPulse: string;
    vitalsTemp: string;
    vitalsWeight: string;
    symptoms: string[];
    diagnosis: string;
    medications: Medication[];
    advice: string;
    nextVisit: string;
}

interface Props {
    doctorName: string;
    doctorDepartment: string;
    report: ReportData | null;
}

/* ─── Mini A4 Preview (thumbnail) ────────────────────────────────── */
function ReportThumbnail({
    data,
    doctorName,
    doctorDept,
}: {
    data: ReportData;
    doctorName: string;
    doctorDept: string;
}) {
    return (
        <div className="w-full aspect-[210/297] bg-white rounded-xl overflow-hidden shadow-lg shadow-black/40 relative">
            <div className="p-3 scale-[0.6] origin-top-left w-[166%]">
                <div className="text-center border-b-2 border-sky-600 pb-2 mb-2">
                    <p className="text-sm font-bold text-sky-700">MediFlow</p>
                    <p className="text-[9px] text-gray-600">{doctorName} · {doctorDept}</p>
                </div>
                <div className="flex gap-4 text-[8px] text-gray-700 mb-2">
                    <span><b>Name:</b> {data.patientName}</span>
                    <span><b>Date:</b> {data.date}</span>
                </div>
                <div className="flex gap-3 text-[7px] bg-sky-50 rounded p-1 mb-2 text-gray-600">
                    <span>BP: {data.vitalsBp}</span>
                    <span>Pulse: {data.vitalsPulse}</span>
                    <span>Temp: {data.vitalsTemp}</span>
                </div>
                {data.diagnosis && (
                    <div className="text-[7px] text-gray-700 mb-1">
                        <b>Dx:</b> {data.diagnosis.substring(0, 60)}...
                    </div>
                )}
                {data.medications.filter(m => m.name).length > 0 && (
                    <div className="text-[7px] text-gray-700">
                        <b>Rx:</b>
                        {data.medications.filter(m => m.name).map((m, i) => (
                            <div key={i} className="ml-2">{i + 1}. {m.name}</div>
                        ))}
                    </div>
                )}
            </div>
            <div className="absolute inset-0 bg-sky-500/0 hover:bg-sky-500/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                <span className="px-3 py-1.5 bg-[#0d1117]/90 text-sky-400 text-xs font-bold rounded-lg shadow-lg">
                    Click to view
                </span>
            </div>
        </div>
    );
}

/* ─── Full A4 Preview ─────────────────────────────────────────── */
function ReportPreview({
    data,
    doctorName,
    doctorDept,
}: {
    data: ReportData;
    doctorName: string;
    doctorDept: string;
}) {
    return (
        <div className="bg-white text-gray-900 rounded-xl shadow-2xl shadow-black/50 p-8 max-w-[700px] mx-auto" id="patient-report-printable">
            <div className="text-center border-b-2 border-sky-600 pb-4 mb-5">
                <h2 className="text-xl font-bold text-sky-700 tracking-tight">MediFlow</h2>
                <p className="text-sm font-semibold text-gray-700 mt-1">{doctorName}</p>
                <p className="text-xs text-gray-500">{doctorDept}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                <div><span className="text-gray-500 text-xs">Name:</span> <span className="font-semibold">{data.patientName}</span></div>
                <div><span className="text-gray-500 text-xs">Date:</span> <span className="font-semibold">{data.date}</span></div>
                <div><span className="text-gray-500 text-xs">Age/Sex:</span> <span className="font-semibold">{data.age}{data.gender ? ` / ${data.gender}` : ""}</span></div>
            </div>
            <div className="flex gap-4 bg-sky-50 rounded-lg px-4 py-2 text-xs text-gray-700 mb-5">
                <span><b>BP:</b> {data.vitalsBp}</span>
                <span><b>Pulse:</b> {data.vitalsPulse}</span>
                <span><b>Temp:</b> {data.vitalsTemp}</span>
                <span><b>Wt/Ht:</b> {data.vitalsWeight}</span>
            </div>
            <div className="grid grid-cols-[200px_1fr] gap-6 mb-5">
                <div className="space-y-4 border-r border-gray-200 pr-4">
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Symptoms</h4>
                        <ul className="text-sm space-y-1 list-disc list-inside text-gray-700">
                            {data.symptoms.filter(s => s.trim()).map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Diagnosis</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.diagnosis}</p>
                    </div>
                </div>
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Medications (Rx)</h4>
                    <div className="space-y-2">
                        {data.medications.filter(m => m.name.trim()).map((med, i) => (
                            <div key={i} className="text-sm">
                                <p className="font-semibold text-gray-800">{i + 1}. {med.name}</p>
                                <p className="text-xs text-gray-500 ml-4">
                                    {[med.dosage, med.frequency, med.duration].filter(Boolean).join(" · ")}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex justify-between items-end border-t border-gray-200 pt-4">
                <div className="max-w-[400px]">
                    {data.advice && (
                        <div className="mb-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Advice</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.advice}</p>
                        </div>
                    )}
                    {data.nextVisit && (
                        <p className="text-sm font-semibold text-gray-700">Next Visit: {data.nextVisit}</p>
                    )}
                </div>
                <div className="text-center">
                    <div className="w-32 border-b border-gray-400 mb-1" />
                    <p className="text-xs font-semibold text-gray-600">Doctor&apos;s Signature</p>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT — Patient view (read-only)
   ═══════════════════════════════════════════════════════════════════ */

export default function PatientReportPanel({ doctorName, doctorDepartment, report }: Props) {
    const [showModal, setShowModal] = useState(false);

    if (!report) {
        return (
            <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    Medical Report
                </p>
                <div className="w-full aspect-[210/297] bg-white/[0.03] border-2 border-dashed border-white/[0.12] rounded-xl flex flex-col items-center justify-center gap-3">
                    <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <p className="text-xs text-slate-600 font-semibold">No Report Yet</p>
                    <p className="text-[10px] text-slate-700">Doctor hasn&apos;t created a report</p>
                </div>
            </div>
        );
    }

    const handlePrint = () => {
        const html = generatePrintHTML(report, doctorName, doctorDepartment);
        const win = window.open("", "_blank");
        if (!win) return;
        win.document.write(html);
        win.document.close();
        win.onload = () => { win.print(); };
    };

    return (
        <>
            <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    Medical Report
                </p>
                <button onClick={() => setShowModal(true)} className="w-full text-left transition-transform hover:scale-[1.02]">
                    <ReportThumbnail data={report} doctorName={doctorName} doctorDept={doctorDepartment} />
                </button>
                <p className="text-[10px] text-slate-600 text-center">Click to view / download</p>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative z-10 w-full max-w-3xl bg-[#0d1117] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
                        <div className="sticky top-0 z-20 bg-[#0d1117] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">📋</span>
                                <div>
                                    <h3 className="text-base font-extrabold tracking-tight text-slate-100">Medical Report</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">By {doctorName} · {doctorDepartment}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={handlePrint} className="px-4 py-2 rounded-xl bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30 hover:bg-sky-500/20 text-xs font-bold transition-all flex items-center gap-1.5">
                                    🖨️ Download / Print
                                </button>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.05] text-slate-500 hover:text-slate-200 hover:bg-white/[0.1] transition-all text-xs"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <ReportPreview data={report} doctorName={doctorName} doctorDept={doctorDepartment} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
