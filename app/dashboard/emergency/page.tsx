"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const EMERGENCY_TYPES = [
  { label: "Chest Pain", icon: "💔", desc: "Severe pressure or tightness in chest" },
  { label: "Breathing Difficulty", icon: "🫁", desc: "Shortness of breath or wheezing" },
  { label: "Accident / Trauma", icon: "🚑", desc: "Injury from accident or fall" },
  { label: "Severe Bleeding", icon: "🩸", desc: "Uncontrolled bleeding from wound" },
  { label: "Allergic Reaction", icon: "⚠️", desc: "Swelling, hives, anaphylaxis" },
  { label: "Other Emergency", icon: "🆘", desc: "Any other urgent medical situation" },
];

export default function EmergencyPage() {
  const router = useRouter();
  const [emergencyType, setEmergencyType] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = async () => {
    if (!emergencyType) return;
    setLoading(true);

    await fetch("/api/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "EMERGENCY",
        title: `Emergency — ${emergencyType}`,
        description: description || `Emergency type: ${emergencyType}`,
        department: "Emergency",
        priority: "CRITICAL",
      }),
    });

    setConfirmed(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  };

  if (confirmed) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="text-center space-y-4 animate-pulse">
          <div className="w-20 h-20 mx-auto rounded-full bg-rose-500/20 ring-4 ring-rose-500/40 flex items-center justify-center">
            <svg className="w-10 h-10 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">Emergency Request Sent</h2>
          <p className="text-sm text-slate-500">A doctor has been notified. Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 border-b border-rose-500/10 bg-[#080c14]/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5 text-slate-100 font-bold tracking-tight">
          <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_theme(colors.rose.500)] animate-pulse" />
          MediFlow
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-5 md:px-8 py-10 space-y-8">
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

        {/* Alert banner */}
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
            <span className="text-2xl">🚨</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-rose-400">
              Emergency Request
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              An available emergency doctor will be auto-assigned immediately. Priority is set to <span className="text-rose-400 font-bold">CRITICAL</span>.
            </p>
          </div>
        </div>

        {/* Emergency Type Selection */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            What is the emergency?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EMERGENCY_TYPES.map((et) => (
              <button
                key={et.label}
                type="button"
                onClick={() => setEmergencyType(et.label)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 border ${emergencyType === et.label
                    ? "bg-rose-500/10 border-rose-500/40 shadow-[0_0_15px_-3px_rgba(244,63,94,0.2)]"
                    : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.15]"
                  }`}
              >
                <span className="text-xl shrink-0">{et.icon}</span>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${emergencyType === et.label ? "text-rose-300" : "text-slate-300"}`}>
                    {et.label}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{et.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        {emergencyType && (
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Additional Details (optional)
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the emergency situation, symptoms, or any relevant information..."
              rows={3}
              className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20 transition-all resize-none"
            />
          </div>
        )}

        {/* Submit */}
        {emergencyType && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-sm tracking-tight bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_25px_-5px_rgba(244,63,94,0.5)] hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.7)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed animate-pulse"
            style={{ animationDuration: "2s" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending emergency request...
              </span>
            ) : (
              "🚨  Request Emergency Help"
            )}
          </button>
        )}
      </div>
    </div>
  );
}