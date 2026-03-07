import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

function statusColor(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-400",
    IN_PROGRESS: "bg-sky-500/10 text-sky-400",
    COMPLETED: "bg-emerald-500/10 text-emerald-400",
  };
  return map[status] ?? "bg-slate-500/10 text-slate-400";
}

function statusDot(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-400",
    IN_PROGRESS: "bg-sky-400",
    COMPLETED: "bg-emerald-400",
  };
  return map[status] ?? "bg-slate-400";
}

export default async function PatientLabTests() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (!user) redirect("/dashboard");

  const labTests = await prisma.labTest.findMany({
    where: {
      request: {
        userId: user.id,
      },
    },
    include: {
      request: true,
      labDoctor: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-[#060a10] text-slate-200 px-6 py-12 md:px-12 lg:px-20">
      {/* Header */}
      <div className="mb-12">
       
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Lab Tests
        </h1>
        <div className="mt-3 h-px w-16 bg-gradient-to-r from-sky-500 to-transparent" />
      </div>

      {labTests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-5">
            <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-slate-400 font-medium">No lab tests ordered yet</p>
          <p className="text-slate-600 text-sm mt-1">Tests ordered by your doctor will appear here</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl">
          {labTests.map((test, index) => (
            <div
              key={test.id}
              className="group relative bg-white/[0.025] hover:bg-white/[0.04] border border-white/[0.07] hover:border-white/[0.12] rounded-2xl p-6 transition-all duration-300"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {/* Subtle left accent bar */}
              <div
                className={`absolute left-0 top-6 bottom-6 w-[2px] rounded-full opacity-60 ${
                  test.status === "COMPLETED"
                    ? "bg-emerald-400"
                    : test.status === "IN_PROGRESS"
                    ? "bg-sky-400"
                    : "bg-amber-400"
                }`}
              />

              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-slate-100 tracking-tight truncate">
                    {test.testType}
                  </p>

                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                      {test.department}
                    </span>

                    {test.labDoctor && (
                      <>
                        <span className="w-px h-3 bg-slate-700" />
                        <span className="text-xs text-slate-600">
                          {test.labDoctor.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status badge with dot */}
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${statusColor(
                    test.status
                  )}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot(test.status)} ${
                    test.status === "IN_PROGRESS" ? "animate-pulse" : ""
                  }`} />
                  {test.status.replace("_", " ")}
                </span>
              </div>

              {/* Result block */}
              {test.status === "COMPLETED" && test.result && (
                <div className="mt-5 p-4 bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                      Result
                    </p>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {test.result}
                  </p>
                </div>
              )}

              {test.status !== "COMPLETED" && (
                <p className="mt-4 text-xs text-slate-600 flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Result will appear once lab publishes it.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}