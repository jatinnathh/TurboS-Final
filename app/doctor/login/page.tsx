"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DoctorLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch("/api/doctor/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Login failed");
        return;
      }

      const role = data.doctor.role;

      if (role === "ADMIN") {
        router.push("/admin/dashboard");
      } 
      else if (role === "PHARMACY") {
        router.push("/pharmacy/dashboard");
      } 
      else if (role === "LAB") {
        router.push("/lab/dashboard");
      } 
      else {
        router.push("/doctor/dashboard");
      }

    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.06] focus:ring-1 focus:ring-emerald-500/20 transition-all";

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 font-sans flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-sky-500/5 blur-[100px]" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 text-slate-100 font-bold text-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            MediFlow
          </div>

          <span className="text-xs uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full mt-2">
            Doctor Portal
          </span>
        </div>

        {/* Login Card */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8 space-y-5">

          <div>
            <h1 className="text-xl font-bold text-slate-100">
              Welcome back
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs text-slate-500 uppercase">
              Email
            </label>

            <input
              type="email"
              placeholder="doctor@mediflow.com"
              className={inputClass}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs text-slate-500 uppercase">
              Password
            </label>

            <input
              type="password"
              placeholder="••••••••"
              className={inputClass}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Button */}
          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition"
          >
            Sign In →
          </button>

        </div>

        {/* Back */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            ← Back to home
          </Link>
        </div>

      </div>
    </div>
  );
}