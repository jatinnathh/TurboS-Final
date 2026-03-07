"use client";

import { useState } from "react";

export default function GeminiConsult() {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConsult = async () => {
    setLoading(true);

    const res = await fetch("/api/ai/consult", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: `
You are a medical AI assistant.

Patient symptoms:
${symptoms}

Suggest:
- possible diseases
- recommended tests
- risk level
`,
      }),
    });

    const data = await res.json();
    setResult(data.data);
    setLoading(false);
  };

  return (
    <div>
      <p className="text-[10px] uppercase text-slate-500 mb-3">AI Medical Consult</p>

      <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-sm font-semibold text-slate-200">Symptom Analysis</h3>
          <span className="ml-auto text-[11px] font-semibold uppercase tracking-widest text-sky-400/70 bg-sky-400/10 px-2 py-0.5 rounded-full ring-1 ring-sky-400/20">
            AI Powered
          </span>
        </div>

        {/* Textarea */}
        <textarea
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.07] text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 resize-none"
          placeholder="Describe patient symptoms in detail..."
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
        />

        {/* Button */}
        <button
          onClick={handleConsult}
          disabled={loading || !symptoms.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Analyzing...
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Consult AI
            </>
          )}
        </button>

        {/* Result */}
        {result && (
          <div className="border-t border-white/[0.06] pt-4 space-y-2">
            <p className="text-[10px] uppercase text-slate-500">AI Response</p>
            <div className="bg-black/30 border border-white/[0.07] rounded-xl px-5 py-4 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
              {result}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}