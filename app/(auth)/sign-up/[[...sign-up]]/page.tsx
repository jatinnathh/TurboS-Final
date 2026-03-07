import { SignUp } from "@clerk/nextjs";
import React from "react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 font-sans flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-sky-500/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 w-full">

        {/* Logo + badge */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-slate-100 font-bold text-lg tracking-tight">
            <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_10px_theme(colors.sky.400)] animate-pulse" />
            MediFlow
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-sky-400/70 bg-sky-400/10 px-3 py-1 rounded-full ring-1 ring-sky-400/20">
            Patient Portal
          </span>
          <p className="text-sm text-slate-500 font-light text-center max-w-xs">
            Create your account to start managing your hospital care
          </p>
        </div>

        {/* Clerk SignUp */}
        <SignUp
          appearance={{
            variables: {
              colorBackground:      "#0d1117",
              colorInputBackground: "#ffffff08",
              colorInputText:       "#e2e8f0",
              colorText:            "#e2e8f0",
              colorTextSecondary:   "#64748b",
              colorPrimary:         "#38bdf8",
              colorDanger:          "#f43f5e",
              borderRadius:         "0.75rem",
              fontFamily:           "inherit",
              fontSize:             "14px",
            },
            elements: {
              rootBox:                      "w-full max-w-sm",
              card:                         "bg-white/[0.03] border border-white/[0.07] shadow-none rounded-2xl !shadow-none",
              headerTitle:                  "text-slate-100 font-extrabold tracking-tight",
              headerSubtitle:               "text-slate-500 font-light",
              socialButtonsBlockButton:     "bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:bg-white/[0.07] transition-all rounded-xl",
              socialButtonsBlockButtonText: "text-slate-300 font-semibold text-sm",
              dividerLine:                  "bg-white/[0.07]",
              dividerText:                  "text-slate-600 text-xs",
              formFieldLabel:               "text-[11px] font-semibold uppercase tracking-widest text-slate-500",
              formFieldInput:               "bg-white/[0.04] border border-white/[0.08] text-slate-200 rounded-xl placeholder-slate-600 focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/20 transition-all",
              formButtonPrimary:            "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30 hover:bg-sky-500/20 font-bold rounded-xl transition-all hover:-translate-y-0.5 shadow-none",
              footerActionLink:             "text-sky-400 hover:text-sky-300 font-semibold",
              footerActionText:             "text-slate-500",
              identityPreviewText:          "text-slate-300",
              identityPreviewEditButton:    "text-sky-400",
              alertText:                    "text-rose-400 text-xs",
              formResendCodeLink:           "text-sky-400 hover:text-sky-300",
            },
          }}
        />

        {/* Back link */}
        <a
          href="/"
          className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          ← Back to home
        </a>

      </div>
    </div>
  );
}