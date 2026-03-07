import { prisma } from "@/lib/prisma";
import { getDoctorFromToken } from "@/lib/doctorAuth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const doctor = await getDoctorFromToken();
  if (!doctor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId, doctorId } = await req.json();

  if (!requestId || !doctorId) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const request = await prisma.request.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (request.doctorId !== doctor.id) {
    return NextResponse.json(
      { error: "You are not assigned to this case" },
      { status: 403 }
    );
  }

  const newDoctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
  });

  if (!newDoctor) {
    return NextResponse.json(
      { error: "Selected doctor not found" },
      { status: 404 }
    );
  }

  if (newDoctor.id === doctor.id) {
    return NextResponse.json(
      { error: "Cannot refer to yourself" },
      { status: 400 }
    );
  }

  // 1️⃣ Close old active logs
  await prisma.requestLog.updateMany({
    where: {
      requestId,
      status: "IN_PROGRESS",
    },
    data: {
      status: "COMPLETED",
    },
  });

  // 2️⃣ Update request owner
  await prisma.request.update({
    where: { id: requestId },
    data: {
      doctorId: newDoctor.id,
      department: newDoctor.department,
      status: "IN_PROGRESS",
    },
  });

  // 3️⃣ Add referral log
  await prisma.requestLog.create({
    data: {
      requestId,
      department: newDoctor.department,
      action: `Referred to ${newDoctor.name} (${newDoctor.department})`,
      performedBy: doctor.name,
      status: "COMPLETED",
    },
  });

  // 4️⃣ Start new department log
  await prisma.requestLog.create({
    data: {
      requestId,
      department: newDoctor.department,
      action: `${newDoctor.department} evaluation started`,
      performedBy: newDoctor.name,
      status: "IN_PROGRESS",
    },
  });

  return NextResponse.json({ success: true });
}