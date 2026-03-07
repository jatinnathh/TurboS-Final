"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

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
  requestId: string;
  doctorName: string;
  doctorDepartment: string;
  patientEmail: string;
  initialReport?: Partial<ReportData> | null;
}

export default function DoctorReportPanel({
  requestId,
  doctorName,
  doctorDepartment,
  patientEmail,
  initialReport,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hasReport = !!initialReport;

  // Wait for client mount before using createPortal
  useEffect(() => { setMounted(true); }, []);

  // Lock body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const [data, setData] = useState<ReportData>({
    patientName: initialReport?.patientName ?? "",
    date: initialReport?.date ?? new Date().toISOString().split("T")[0],
    age: initialReport?.age ?? "",
    gender: initialReport?.gender ?? "",
    vitalsBp: initialReport?.vitalsBp ?? "",
    vitalsPulse: initialReport?.vitalsPulse ?? "",
    vitalsTemp: initialReport?.vitalsTemp ?? "",
    vitalsWeight: initialReport?.vitalsWeight ?? "",
    symptoms: initialReport?.symptoms ?? [""],
    diagnosis: initialReport?.diagnosis ?? "",
    medications: initialReport?.medications ?? [{ name: "", dosage: "", frequency: "", duration: "" }],
    advice: initialReport?.advice ?? "",
    nextVisit: initialReport?.nextVisit ?? "",
  });

  const [saving, setSaving] = useState(false);

  const updateField = (field: keyof ReportData, value: any) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const updateSymptom = (i: number, value: string) => {
    const s = [...data.symptoms]; s[i] = value;
    setData((prev) => ({ ...prev, symptoms: s }));
  };
  const addSymptom = () => setData((prev) => ({ ...prev, symptoms: [...prev.symptoms, ""] }));
  const removeSymptom = (i: number) => setData((prev) => ({ ...prev, symptoms: prev.symptoms.filter((_, j) => j !== i) }));

  const updateMed = (i: number, field: keyof Medication, value: string) => {
    const meds = [...data.medications]; meds[i] = { ...meds[i], [field]: value };
    setData((prev) => ({ ...prev, medications: meds }));
  };
  const addMedication = () => setData((prev) => ({ ...prev, medications: [...prev.medications, { name: "", dosage: "", frequency: "", duration: "" }] }));
  const removeMedication = (i: number) => setData((prev) => ({ ...prev, medications: prev.medications.filter((_, j) => j !== i) }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/doctor/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, ...data }),
      });
      setOpen(false);
    } finally { setSaving(false); }
  };

  const ic = "w-full px-3 py-2 bg-white/[0.06] border border-white/[0.1] rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 transition-all";
  const lc = "text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5 block";

  const modal = (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, overflowY: "auto", background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)" }}
      className="flex items-start justify-center px-4 py-8"
    >
      <div
        className="relative w-full max-w-5xl bg-[#0d1117] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navbar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#0d1117] border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_theme(colors.teal.400)] animate-pulse" />
            <div>
              <p className="text-sm font-extrabold tracking-tight text-slate-100">
                {hasReport ? "Edit Medical Report" : "Create Medical Report"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Patient: {patientEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] text-slate-400 ring-1 ring-white/[0.08] hover:bg-white/[0.08] text-xs font-semibold transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500/15 text-teal-400 ring-1 ring-teal-500/30 hover:bg-teal-500/25 text-xs font-bold transition-all disabled:opacity-50"
            >
              {saving
                ? <><div className="w-3.5 h-3.5 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" /> Saving...</>
                : <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Save Report</>
              }
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.05] text-slate-500 hover:text-slate-200 hover:bg-white/[0.1] transition-all text-xs"
            >✕</button>
          </div>
        </div>

        {/* 2-column body */}
        <div className="grid grid-cols-[1fr_420px]">

          {/* LEFT — Form */}
          <div className="p-6 overflow-y-auto max-h-[80vh] space-y-6 border-r border-white/[0.06]">

            <section className="space-y-4">
              <SectionTitle color="bg-sky-400" label="Patient Information" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Patient Name" lc={lc}><input className={ic} placeholder="e.g. John Doe" value={data.patientName} onChange={(e) => updateField("patientName", e.target.value)} /></Field>
                <Field label="Date" lc={lc}><input type="date" className={`${ic} [color-scheme:dark]`} value={data.date} onChange={(e) => updateField("date", e.target.value)} /></Field>
                <Field label="Age" lc={lc}><input className={ic} placeholder="e.g. 35" value={data.age} onChange={(e) => updateField("age", e.target.value)} /></Field>
                <Field label="Gender" lc={lc}>
                  <div className="relative">
                    <select className={`${ic} appearance-none pr-8 bg-[#0d1117] [&>option]:bg-[#0d1117]`} value={data.gender} onChange={(e) => updateField("gender", e.target.value)}>
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </Field>
              </div>
            </section>

            <Divider />

            <section className="space-y-4">
              <SectionTitle color="bg-emerald-400" label="Vitals" />
              <div className="grid grid-cols-2 gap-3">
                {([["vitalsBp","Blood Pressure","120/80 mmHg"],["vitalsPulse","Pulse","72 bpm"],["vitalsTemp","Temperature","98.6 °F"],["vitalsWeight","Weight / Height","70 kg / 175 cm"]] as const).map(([key, label, ph]) => (
                  <Field key={key} label={label} lc={lc}>
                    <input className={ic} placeholder={ph} value={(data as any)[key]} onChange={(e) => updateField(key as keyof ReportData, e.target.value)} />
                  </Field>
                ))}
              </div>
            </section>

            <Divider />

            <section className="space-y-4">
              <SectionTitle color="bg-amber-400" label="Symptoms & Diagnosis" />
              <div className="space-y-2">
                {data.symptoms.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <input className={`${ic} flex-1`} placeholder="e.g. Fever for 3 days" value={s} onChange={(e) => updateSymptom(i, e.target.value)} />
                    {data.symptoms.length > 1 && (
                      <button onClick={() => removeSymptom(i)} className="px-2.5 rounded-xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20 hover:bg-rose-500/20 text-xs transition-all">✕</button>
                    )}
                  </div>
                ))}
                <button onClick={addSymptom} className="text-xs text-teal-400 hover:text-teal-300 transition-colors font-semibold">+ Add Symptom</button>
              </div>
              <Field label="Diagnosis" lc={lc}>
                <textarea className={`${ic} resize-none`} rows={3} placeholder="Primary diagnosis..." value={data.diagnosis} onChange={(e) => updateField("diagnosis", e.target.value)} />
              </Field>
            </section>

            <Divider />

            <section className="space-y-4">
              <SectionTitle color="bg-violet-400" label="Medications (Rx)" />
              {data.medications.map((m, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Medicine {i + 1}</p>
                    {data.medications.length > 1 && <button onClick={() => removeMedication(i)} className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors">Remove</button>}
                  </div>
                  <input className={ic} placeholder="Medicine name" value={m.name} onChange={(e) => updateMed(i, "name", e.target.value)} />
                  <div className="grid grid-cols-3 gap-2">
                    <input className={ic} placeholder="Dosage" value={m.dosage} onChange={(e) => updateMed(i, "dosage", e.target.value)} />
                    <input className={ic} placeholder="Frequency" value={m.frequency} onChange={(e) => updateMed(i, "frequency", e.target.value)} />
                    <input className={ic} placeholder="Duration" value={m.duration} onChange={(e) => updateMed(i, "duration", e.target.value)} />
                  </div>
                </div>
              ))}
              <button onClick={addMedication} className="text-xs text-teal-400 hover:text-teal-300 transition-colors font-semibold">+ Add Medication</button>
            </section>

            <Divider />

            <section className="space-y-4">
              <SectionTitle color="bg-cyan-400" label="Advice & Follow-up" />
              <Field label="Advice" lc={lc}>
                <textarea className={`${ic} resize-none`} rows={2} placeholder="Rest, diet instructions..." value={data.advice} onChange={(e) => updateField("advice", e.target.value)} />
              </Field>
              <Field label="Next Visit" lc={lc}>
                <input type="date" className={`${ic} [color-scheme:dark]`} value={data.nextVisit} onChange={(e) => updateField("nextVisit", e.target.value)} />
              </Field>
            </section>

          </div>

          {/* RIGHT — Live Preview */}
          <div className="p-6 overflow-y-auto max-h-[80vh] bg-[#080c14]">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-4">Live Preview</p>
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl text-[#111]">
              <div className="px-6 pt-5 pb-4 border-b-2 border-sky-500">
                <h1 className="text-xl font-extrabold text-center text-sky-600 tracking-tight">MediFlow</h1>
                <p className="text-sm font-bold text-center text-gray-700 mt-0.5">{doctorName}</p>
                <p className="text-xs text-center text-gray-400">{doctorDepartment}</p>
              </div>
              <div className="px-5 py-3 bg-gray-50 flex flex-wrap gap-x-6 gap-y-1 text-xs border-b border-gray-200">
                <span><span className="text-gray-400">Name: </span><b>{data.patientName || "—"}</b></span>
                <span><span className="text-gray-400">Date: </span><b>{data.date}</b></span>
                <span><span className="text-gray-400">Age/Sex: </span><b>{data.age || "—"} {data.gender}</b></span>
              </div>
              <div className="px-5 py-2.5 bg-sky-50 flex flex-wrap gap-x-5 gap-y-1 text-xs border-b border-sky-100">
                {[["BP", data.vitalsBp], ["Pulse", data.vitalsPulse], ["Temp", data.vitalsTemp], ["Wt/Ht", data.vitalsWeight]].map(([label, val]) => (
                  <span key={label} className="flex items-center gap-1">
                    <span className="text-sky-500 font-semibold">{label}:</span>
                    <span className="font-medium text-gray-700">{val || "—"}</span>
                  </span>
                ))}
              </div>
              <div className="px-5 py-4 grid grid-cols-2 gap-4 text-xs border-b border-gray-200">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Symptoms</p>
                  <ul className="space-y-1">
                    {data.symptoms.filter(Boolean).map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5"><span className="text-sky-400 mt-0.5">•</span><span className="text-gray-700">{s}</span></li>
                    ))}
                    {!data.symptoms.filter(Boolean).length && <li className="text-gray-300 italic">None listed</li>}
                  </ul>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-4 mb-1">Diagnosis</p>
                  <p className="text-gray-700">{data.diagnosis || <span className="text-gray-300 italic">—</span>}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Medications (Rx)</p>
                  <ol className="space-y-2">
                    {data.medications.filter((m) => m.name).map((m, i) => (
                      <li key={i} className="text-gray-700">
                        <span className="font-bold">{i + 1}. {m.name}</span>
                        <span className="text-gray-400 ml-1">{m.dosage} · {m.frequency} · {m.duration}</span>
                      </li>
                    ))}
                    {!data.medications.filter((m) => m.name).length && <li className="text-gray-300 italic">None prescribed</li>}
                  </ol>
                </div>
              </div>
              {data.advice && (
                <div className="px-5 py-3 border-b border-gray-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Advice</p>
                  <p className="text-xs text-gray-600">{data.advice}</p>
                </div>
              )}
              <div className="px-5 py-4 flex items-end justify-between">
                {data.nextVisit ? (
                  <div>
                    <p className="text-[10px] text-gray-400">Next Visit</p>
                    <p className="text-xs font-bold text-gray-700">{data.nextVisit}</p>
                  </div>
                ) : <div />}
                <div className="text-right">
                  <div className="w-28 border-b border-gray-300 mb-1" />
                  <p className="text-[10px] text-gray-400">Doctor&apos;s Signature</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar card */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
          <span className="text-sm">🗒️</span>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Medical Report</p>
        </div>
        {hasReport ? (
          <div onClick={() => setOpen(true)} className="p-4 cursor-pointer group hover:bg-white/[0.03] transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_theme(colors.emerald.400)]" />
              <p className="text-xs font-bold text-emerald-400">Report Saved</p>
            </div>
            <p className="text-xs text-slate-300 font-semibold truncate">{data.patientName || patientEmail}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{data.date}</p>
            {data.diagnosis && <p className="text-[10px] text-slate-600 mt-2 line-clamp-2 italic">{data.diagnosis}</p>}
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-teal-400 group-hover:gap-2 transition-all">
              <span>Edit Report</span><span>→</span>
            </div>
          </div>
        ) : (
          <div onClick={() => setOpen(true)} className="p-6 flex flex-col items-center justify-center gap-3 cursor-pointer group hover:bg-white/[0.03] transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-dashed border-white/[0.15] group-hover:border-teal-500/40 transition-colors flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-600 group-hover:text-teal-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">No Report Yet</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Click to create</p>
            </div>
          </div>
        )}
        <div className="px-4 pb-4">
          <button
            onClick={() => setOpen(true)}
            className="w-full py-2 rounded-xl bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/25 hover:bg-teal-500/20 hover:ring-teal-400/50 text-xs font-bold transition-all"
          >
            {hasReport ? "Edit Report" : "Create Report"}
          </button>
        </div>
      </div>

      {/* Portal — renders at document.body, truly above ALL content */}
      {mounted && open && createPortal(modal, document.body)}
    </>
  );
}

// ── Tiny helpers ──────────────────────────────────────────────────────────────
function SectionTitle({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <h3 className="text-sm font-bold text-slate-200">{label}</h3>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-white/[0.06]" />;
}

function Field({ label, lc, children }: { label: string; lc: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={lc}>{label}</label>
      {children}
    </div>
  );
}