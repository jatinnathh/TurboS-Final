"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PublishResultForm({ labTestId }: { labTestId: string }) {
  const router = useRouter();
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!result.trim()) {
      alert("Please enter lab result");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/lab/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labTestId, result }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error("Server error:", data);
        alert(data.error || "Failed to publish result");
        setLoading(false);
        return;
      }

      alert("Result published successfully ✅");

      router.refresh();
      router.push("/doctor/dashboard");
    } catch (error) {
      console.error("Fetch failed:", error);
      alert("Network error. Check your server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-sm font-bold tracking-tight text-slate-200">Publish Lab Result</h3>
      </div>

      {/* Textarea */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          Result
        </label>
        <textarea
          value={result}
          onChange={(e) => setResult(e.target.value)}
          placeholder="Enter lab result findings, measurements, and observations..."
          rows={5}
          className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 transition-all resize-none"
        />
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/30 hover:bg-teal-500/20 hover:ring-teal-400/50 hover:-translate-y-0.5 text-sm font-bold tracking-tight transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
            Publishing...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Publish Result
          </span>
        )}
      </button>
    </div>
  );
}