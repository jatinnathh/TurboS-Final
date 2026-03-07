import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDoctorFromToken } from "@/lib/doctorAuth";

export async function POST(req: Request) {
  const doctor = await getDoctorFromToken();
  if (!doctor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = await req.json();

  // Check request belongs to this doctor
  const request = await prisma.request.findUnique({
    where: { id: requestId },
  });

  if (!request || request.doctorId !== doctor.id) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  // ✅ Mark as completed
  await prisma.request.update({
    where: { id: requestId },
    data: { status: "COMPLETED" },
  });

  // ✅ Add log entry
  await prisma.requestLog.create({
    data: {
      requestId,
      department: doctor.department,
      action: "Case marked as completed",
      performedBy: doctor.name,
      status: "COMPLETED",
    },
  });

  return NextResponse.json({ success: true });
}