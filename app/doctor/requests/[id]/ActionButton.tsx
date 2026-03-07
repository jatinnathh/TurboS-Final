"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Doctor {
  id: string;
  name: string;
  department: string;
}

interface Props {
  requestId: string;
  doctors: Doctor[];
}

// ── Reusable Modal wrapper — defined OUTSIDE component to prevent remount ──
function Modal({ show, onClose, borderColor, children }: {
  show: boolean; onClose: () => void; borderColor: string; children: React.ReactNode;
}) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-md bg-[#0d1117] border ${borderColor} rounded-2xl shadow-2xl overflow-hidden`}>
        {children}
      </div>
    </div>
  );
}

// ── Reusable Modal Header — defined OUTSIDE component ─────────────────────
function ModalHeader({ icon, title, subtitle, barColor, onClose }: {
  icon: string; title: string; subtitle: string; barColor: string; onClose: () => void;
}) {
  return (
    <div className="relative px-6 pt-6 pb-5 border-b border-white/[0.06]">
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${barColor} opacity-60`} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none">{icon}</span>
          <div>
            <h3 className="text-base font-extrabold tracking-tight text-slate-100">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.05] text-slate-500 hover:text-slate-200 hover:bg-white/[0.1] transition-all shrink-0 text-xs"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ── Select wrapper with chevron — defined OUTSIDE component ───────────────
function SelectField({ label, value, onChange, disabled, children }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean; children: React.ReactNode;
}) {
  const selectClass =
    "w-full px-4 py-2.5 bg-[#0d1117] border border-white/[0.1] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/20 transition-all appearance-none cursor-pointer [&>option]:bg-[#0d1117] [&>option]:text-slate-200";

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</label>
      <div className="relative">
        <select
          className={`${selectClass} pr-10 ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          {children}
        </select>
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ActionButtons({ requestId, doctors }: Props) {
  const router = useRouter();

  const [showRefer, setShowRefer] = useState(false);
  const [showPrescribe, setShowPrescribe] = useState(false);
  const [showWard, setShowWard] = useState(false);
  const [showLab, setShowLab] = useState(false);

  const [selectedWard, setSelectedWard] = useState("");
  const [selectedLab, setSelectedLab] = useState("");
  const [testType, setTestType] = useState("");

  const [selectedDept, setSelectedDept] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");

  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [notes, setNotes] = useState("");

  const departments = [...new Set(doctors.map((d) => d.department))];
  const filteredDoctors = doctors.filter((d) => d.department === selectedDept);

  const inputClass =
    "w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/20 transition-all";

  /* ---------------- REFER DOCTOR ---------------- */
  const handleRefer = async () => {
    if (!selectedDept || !selectedDoctor) { alert("Please select department and doctor"); return; }
    const res = await fetch("/api/doctor/refer", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, doctorId: selectedDoctor }),
    });
    if (res.ok) { router.push("/doctor/dashboard"); router.refresh(); }
    else alert("Referral failed");
  };

  /* ---------------- PRESCRIBE ---------------- */
  const handlePrescribe = async () => {
    if (!medication || !dosage || !frequency) { alert("Please fill required prescription fields"); return; }
    const res = await fetch("/api/doctor/prescribe", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, medication, dosage, frequency, notes }),
    });
    if (res.ok) {
      setShowPrescribe(false); setMedication(""); setDosage(""); setFrequency(""); setNotes("");
      router.refresh();
    } else alert("Failed to prescribe");
  };

  /* ---------------- ADMIT ---------------- */
  const handleAdmit = async () => {
    if (!confirm("Admit this patient?")) return;
    const res = await fetch("/api/doctor/admit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });
    if (res.ok) router.refresh();
    else alert("Failed to admit patient");
  };

  /* ---------------- DISCHARGE ---------------- */
  const handleDischarge = async () => {
    if (!confirm("Discharge this patient?")) return;
    const res = await fetch("/api/doctor/discharge", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });
    if (res.ok) { router.push("/doctor/dashboard"); router.refresh(); }
    else alert("Discharge failed");
  };

  /* ---------------- REFER WARD ---------------- */
  const handleReferWard = async () => {
    if (!selectedWard) { alert("Select ward"); return; }
    const res = await fetch("/api/doctor/refer-ward", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, ward: selectedWard }),
    });
    if (res.ok) { setShowWard(false); setSelectedWard(""); router.refresh(); }
    else alert("Ward referral failed");
  };

  /* ---------------- ORDER LAB TEST ---------------- */
  const handleOrderLab = async () => {
    if (!selectedLab || !testType) { alert("Select department and enter test type"); return; }
    const res = await fetch("/api/doctor/order-test", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, department: selectedLab, testType }),
    });
    if (res.ok) { setShowLab(false); setSelectedLab(""); setTestType(""); router.refresh(); }
    else alert("Failed to order test");
  };

  // Action definitions for the grid
  const primaryActions = [
    { icon: "💊", label: "Prescribe", desc: "Add medication", onClick: () => setShowPrescribe(true), bg: "bg-emerald-500/8", ring: "ring-emerald-500/25", bar: "bg-emerald-500", text: "text-emerald-300" },
    { icon: "🔁", label: "Refer Patient", desc: "Transfer to doctor", onClick: () => setShowRefer(true), bg: "bg-amber-500/8", ring: "ring-amber-500/25", bar: "bg-amber-500", text: "text-amber-300" },
    { icon: "🏨", label: "Refer Ward", desc: "Assign hospital ward", onClick: () => setShowWard(true), bg: "bg-violet-500/8", ring: "ring-violet-500/25", bar: "bg-violet-500", text: "text-violet-300" },
    { icon: "🧪", label: "Order Lab Test", desc: "Request diagnostics", onClick: () => setShowLab(true), bg: "bg-teal-500/8", ring: "ring-teal-500/25", bar: "bg-teal-500", text: "text-teal-300" },
    { icon: "🏥", label: "Admit", desc: "Admit patient", onClick: handleAdmit, bg: "bg-sky-500/8", ring: "ring-sky-500/25", bar: "bg-sky-500", text: "text-sky-300" },
  ];

  return (
    <>
      {/* ── Action Grid ── */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Actions</p>
          <span className="text-[10px] text-slate-600">{primaryActions.length + 1} available</span>
        </div>

        {/* Top 3 */}
        <div className="grid grid-cols-3 gap-2.5">
          {primaryActions.slice(0, 3).map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className={`group relative flex flex-col items-start gap-3 px-4 py-4 rounded-xl ${a.bg} ring-1 ${a.ring} hover:ring-opacity-60 hover:bg-white/[0.06] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden text-left`}
            >
              <div className={`absolute top-0 left-0 right-0 h-[2px] ${a.bar} opacity-30 group-hover:opacity-70 transition-opacity`} />
              <span className="text-xl leading-none">{a.icon}</span>
              <div>
                <p className={`text-xs font-bold tracking-tight ${a.text}`}>{a.label}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{a.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom 2 wide + Discharge */}
        <div className="grid grid-cols-2 gap-2.5">
          {primaryActions.slice(3).map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-xl ${a.bg} ring-1 ${a.ring} hover:ring-opacity-60 hover:bg-white/[0.06] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden text-left`}
            >
              <div className={`absolute top-0 left-0 bottom-0 w-[2px] ${a.bar} opacity-30 group-hover:opacity-70 transition-opacity`} />
              <span className="text-xl leading-none shrink-0">{a.icon}</span>
              <div className="min-w-0">
                <p className={`text-xs font-bold tracking-tight ${a.text}`}>{a.label}</p>
                <p className="text-[10px] text-slate-600 mt-0.5 truncate">{a.desc}</p>
              </div>
            </button>
          ))}

          {/* Discharge — full width, rose, more prominent */}
          <button
            onClick={handleDischarge}
            className="group relative col-span-2 flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl bg-rose-500/8 ring-1 ring-rose-500/25 hover:bg-rose-500/15 hover:ring-rose-400/50 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-rose-500 opacity-30 group-hover:opacity-70 transition-opacity" />
            <span className="text-xl leading-none">🏁</span>
            <div className="text-left">
              <p className="text-xs font-bold tracking-tight text-rose-300">Discharge Patient</p>
              <p className="text-[10px] text-slate-600">Close and complete this case</p>
            </div>
          </button>
        </div>
      </div>

      {/* ── PRESCRIBE MODAL ── */}
      <Modal show={showPrescribe} onClose={() => setShowPrescribe(false)} borderColor="border-emerald-500/20">
        <ModalHeader icon="💊" title="Add Prescription" subtitle="Prescribe medication for this patient" barColor="bg-emerald-500" onClose={() => setShowPrescribe(false)} />
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Medication</label>
            <input className={inputClass} placeholder="e.g. Amoxicillin" value={medication} onChange={(e) => setMedication(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Dosage</label>
              <input className={inputClass} placeholder="e.g. 500mg" value={dosage} onChange={(e) => setDosage(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Frequency</label>
              <input className={inputClass} placeholder="e.g. Twice daily" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Notes <span className="normal-case text-slate-600">(optional)</span>
            </label>
            <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Additional instructions..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={handlePrescribe} className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20 text-sm font-bold transition-all">
              Add Prescription
            </button>
            <button onClick={() => setShowPrescribe(false)} className="px-5 py-2.5 rounded-xl bg-white/[0.04] text-slate-500 ring-1 ring-white/[0.08] hover:bg-white/[0.07] text-sm font-semibold transition-all">
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* ── REFER DOCTOR MODAL ── */}
      <Modal show={showRefer} onClose={() => setShowRefer(false)} borderColor="border-amber-500/20">
        <ModalHeader icon="🔁" title="Refer Patient" subtitle="Transfer care to another department" barColor="bg-amber-500" onClose={() => setShowRefer(false)} />
        <div className="px-6 py-5 space-y-4">
          <SelectField label="Department" value={selectedDept} onChange={(v) => { setSelectedDept(v); setSelectedDoctor(""); }}>
            <option value="">Select Department</option>
            {departments.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
          </SelectField>
          <SelectField label="Doctor" value={selectedDoctor} onChange={setSelectedDoctor} disabled={!selectedDept}>
            <option value="">Select Doctor</option>
            {filteredDoctors.map((doc) => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
          </SelectField>
          <div className="flex gap-3 pt-1">
            <button onClick={handleRefer} className="flex-1 py-2.5 rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30 hover:bg-amber-500/20 text-sm font-bold transition-all">
              Confirm Referral
            </button>
            <button onClick={() => setShowRefer(false)} className="px-5 py-2.5 rounded-xl bg-white/[0.04] text-slate-500 ring-1 ring-white/[0.08] hover:bg-white/[0.07] text-sm font-semibold transition-all">
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* ── REFER WARD MODAL ── */}
      <Modal show={showWard} onClose={() => setShowWard(false)} borderColor="border-violet-500/20">
        <ModalHeader icon="🏨" title="Refer to Ward" subtitle="Transfer patient to a hospital ward" barColor="bg-violet-500" onClose={() => setShowWard(false)} />
        <div className="px-6 py-5 space-y-4">
          <SelectField label="Ward" value={selectedWard} onChange={setSelectedWard}>
            <option value="">Select Ward</option>
            <option value="General Ward">General Ward</option>
            <option value="ICU">ICU</option>
            <option value="HDU">HDU</option>
            <option value="Cardiac Ward">Cardiac Ward</option>
            <option value="Surgical Ward">Surgical Ward</option>
            <option value="Paediatric Ward">Paediatric Ward</option>
          </SelectField>
          <div className="flex gap-3 pt-1">
            <button onClick={handleReferWard} className="flex-1 py-2.5 rounded-xl bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/30 hover:bg-violet-500/20 text-sm font-bold transition-all">
              Confirm Ward Transfer
            </button>
            <button onClick={() => setShowWard(false)} className="px-5 py-2.5 rounded-xl bg-white/[0.04] text-slate-500 ring-1 ring-white/[0.08] hover:bg-white/[0.07] text-sm font-semibold transition-all">
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* ── ORDER LAB TEST MODAL ── */}
      <Modal show={showLab} onClose={() => setShowLab(false)} borderColor="border-teal-500/20">
        <ModalHeader icon="🧪" title="Order Lab Test" subtitle="Request a diagnostic test for this patient" barColor="bg-teal-500" onClose={() => setShowLab(false)} />
        <div className="px-6 py-5 space-y-4">
          <SelectField label="Lab Department" value={selectedLab} onChange={setSelectedLab}>
            <option value="">Select Lab Department</option>
            <option value="Radiology">Radiology</option>
            <option value="Pathology">Pathology</option>
            <option value="Blood Lab">Blood Lab</option>
            <option value="Cardiac Lab">Cardiac Lab</option>
          </SelectField>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Test Type</label>
            <input className={inputClass} placeholder="e.g. CBC, X-Ray Chest, ECG" value={testType} onChange={(e) => setTestType(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={handleOrderLab} className="flex-1 py-2.5 rounded-xl bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/30 hover:bg-teal-500/20 text-sm font-bold transition-all">
              Confirm Order
            </button>
            <button onClick={() => setShowLab(false)} className="px-5 py-2.5 rounded-xl bg-white/[0.04] text-slate-500 ring-1 ring-white/[0.08] hover:bg-white/[0.07] text-sm font-semibold transition-all">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}