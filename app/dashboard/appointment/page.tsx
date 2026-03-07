
// Appointment page · TSX
// Copy

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  department: string;
}

const DEPARTMENTS = [
  "General Medicine",
  "Cardiology",
  "Orthopedics",
  "Neurology",
  "Pediatrics",
];

// Generate time slots from 09:00 to 18:00 in 1-hour blocks
const TIME_SLOTS = [
  "09-10", "10-11", "11-12", "12-13",
  "13-14", "14-15", "15-16", "16-17", "17-18",
];

export default function AppointmentPage() {
  const router = useRouter();
  const [department, setDepartment] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Today's date in YYYY-MM-DD for min attribute
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!department) {
      setDoctors([]);
      setSelectedDoctor(null);
      return;
    }
    setLoadingDoctors(true);
    setSelectedDoctor(null);
    fetch(`/api/doctor/department?department=${encodeURIComponent(department)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to fetch doctors");
        const text = await r.text();
        return text ? JSON.parse(text) : [];
      })
      .then((data) => {
        setDoctors(data);
      })
      .catch((err) => {
        console.error(err);
        setDoctors([]);
      })
      .finally(() => {
        setLoadingDoctors(false);
      });
  }, [department]);

  // Fetch booked slots whenever doctor or date changes
  useEffect(() => {
    if (!selectedDoctor || !date) {
      setBookedSlots([]);
      return;
    }
    setLoadingSlots(true);
    setSelectedSlot(""); // reset selection
    fetch(
      `/api/request/booked-slots?doctorId=${encodeURIComponent(selectedDoctor.id)}&date=${encodeURIComponent(date)}`
    )
      .then((r) => r.json())
      .then((slots) => {
        setBookedSlots(Array.isArray(slots) ? slots : []);
        setLoadingSlots(false);
      })
      .catch(() => setLoadingSlots(false));
  }, [selectedDoctor, date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department || !selectedDoctor || !date || !selectedSlot) return;
    setLoading(true);

    // Convert slot like "11-12" to time "11:00"
    const slotHour = selectedSlot.split("-")[0];
    const appointmentDate = `${date}T${slotHour}:00`;

    await fetch("/api/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "APPOINTMENT",
        title: `Appointment — ${department}`,
        description: symptoms || undefined,
        department,
        doctorId: selectedDoctor.id,
        appointmentDate,
        priority: "MEDIUM",
      }),
    });

    router.push("/dashboard");
  };

  const inputClass =
    "w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all";

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 font-sans">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 border-b border-white/5 bg-[#080c14]/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5 text-slate-100 font-bold tracking-tight">
          <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_theme(colors.sky.400)] animate-pulse" />
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

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🗓</span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tighter text-slate-100">
              Book Appointment
            </h1>
          </div>
          <p className="text-sm text-slate-500 font-light">
            Schedule a visit with a specialist in your preferred department
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Step 1: Department ── */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold flex items-center justify-center ring-1 ring-sky-500/30">
                1
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Select Department
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setDepartment(dept)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border ${department === dept
                    ? "bg-sky-500/15 border-sky-500/40 text-sky-300 shadow-[0_0_15px_-3px_rgba(56,189,248,0.2)]"
                    : "bg-white/[0.03] border-white/[0.07] text-slate-400 hover:border-white/[0.15] hover:text-slate-300"
                    }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* ── Step 2: Doctor ── */}
          {department && (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold flex items-center justify-center ring-1 ring-sky-500/30">
                  2
                </span>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Choose Doctor
                </p>
              </div>

              {loadingDoctors ? (
                <div className="flex items-center gap-2 py-6 justify-center text-sm text-slate-500">
                  <div className="w-4 h-4 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
                  Loading doctors...
                </div>
              ) : doctors.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">
                  No doctors available in this department
                </p>
              ) : (
                <div className="grid gap-2">
                  {doctors.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setSelectedDoctor(doc)}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 border text-left ${selectedDoctor?.id === doc.id
                        ? "bg-sky-500/10 border-sky-500/40 shadow-[0_0_15px_-3px_rgba(56,189,248,0.2)]"
                        : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.15]"
                        }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400 font-bold text-sm shrink-0">
                        {doc.name.split(" ").slice(-1)[0][0]}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${selectedDoctor?.id === doc.id ? "text-sky-300" : "text-slate-200"}`}>
                          {doc.name}
                        </p>
                        <p className="text-xs text-slate-500">{doc.specialization}</p>
                      </div>
                      {selectedDoctor?.id === doc.id && (
                        <svg className="w-5 h-5 text-sky-400 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Date & Time Slots ── */}
          {selectedDoctor && (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold flex items-center justify-center ring-1 ring-sky-500/30">
                  3
                </span>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Preferred Date & Time Slot
                </p>
              </div>

              {/* Date picker */}
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">
                  Date <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setSelectedSlot(""); // reset slot on date change
                  }}
                  required
                  min={today}
                  className={inputClass}
                />
                {date && (
                  <p className="mt-1.5 text-xs text-sky-400/70 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </p>
                )}
              </div>

              {/* Time slot grid — only shown after a date is picked */}
              {date && (
                <div>
                  <label className="text-xs text-slate-500 mb-3 block">
                    Available Slots <span className="text-rose-400">*</span>
                  </label>

                  {loadingSlots ? (
                    <div className="flex items-center gap-2 py-6 justify-center text-sm text-slate-500">
                      <div className="w-4 h-4 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
                      Checking availability...
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {TIME_SLOTS.map((slot) => {
                        const isBooked = bookedSlots.includes(slot);
                        const isSelected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isBooked}
                            onClick={() => !isBooked && setSelectedSlot(slot)}
                            className={`flex flex-col items-center justify-center px-3 py-3 rounded-xl border text-xs font-semibold transition-all duration-200 ${isBooked
                              ? "bg-rose-500/10 border-rose-500/30 text-rose-400 opacity-60 cursor-not-allowed"
                              : isSelected
                                ? "bg-sky-500 border-sky-400 text-white shadow-[0_0_18px_-4px_rgba(56,189,248,0.6)]"
                                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400/50"
                              }`}
                          >
                            <span className="text-sm font-bold tracking-tight">
                              {slot.replace("-", "–")}
                            </span>
                            <span className={`text-[9px] uppercase tracking-widest mt-0.5 font-semibold ${isBooked
                              ? "text-rose-500/70"
                              : isSelected
                                ? "text-white/80"
                                : "text-emerald-500/70"
                              }`}>
                              {isBooked ? "Booked" : "Available"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedSlot && (
                    <p className="mt-3 text-xs text-sky-400/70 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Slot {selectedSlot.replace("-", ":00 – ")}:00 selected
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Symptoms ── */}
          {selectedDoctor && (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold flex items-center justify-center ring-1 ring-sky-500/30">
                  4
                </span>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Symptoms / Reason for Visit
                </p>
                <span className="text-[10px] text-slate-600 ml-auto">(optional)</span>
              </div>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe your symptoms or reason for this appointment..."
                rows={4}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all resize-none"
              />
            </div>
          )}

          {/* ── Submit ── */}
          {selectedDoctor && date && selectedSlot && (
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-bold text-sm tracking-tight bg-sky-500 hover:bg-sky-400 text-white shadow-[0_0_20px_-3px_rgba(56,189,248,0.4)] hover:shadow-[0_0_25px_-3px_rgba(56,189,248,0.6)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Booking...
                </span>
              ) : (
                `Confirm Appointment with ${selectedDoctor.name}`
              )}
            </button>
          )}

        </form>
      </div>
    </div>
  );
}