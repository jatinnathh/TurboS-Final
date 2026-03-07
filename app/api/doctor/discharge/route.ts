import { prisma } from "@/lib/prisma";
import { getDoctorFromToken } from "@/lib/doctorAuth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const doctor = await getDoctorFromToken();

  if (!doctor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = await req.json();

  //////////////////////////////////////////////////////
  // 🔎 Find Request
  //////////////////////////////////////////////////////

  const request = await prisma.request.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  //////////////////////////////////////////////////////
  // 🔐 Ensure doctor assigned
  //////////////////////////////////////////////////////

  if (request.doctorId !== doctor.id) {
    return NextResponse.json(
      { error: "You are not assigned to this case" },
      { status: 403 }
    );
  }

  //////////////////////////////////////////////////////
  // 1️⃣ Close active logs
  //////////////////////////////////////////////////////

  await prisma.requestLog.updateMany({
    where: {
      requestId,
      status: "IN_PROGRESS",
    },
    data: {
      status: "COMPLETED",
    },
  });

  //////////////////////////////////////////////////////
  // 2️⃣ Add discharge log
  //////////////////////////////////////////////////////

  await prisma.requestLog.create({
    data: {
      requestId,
      department: request.department || "",
      action: "Patient discharged",
      performedBy: doctor.name,
      status: "COMPLETED",
    },
  });

  //////////////////////////////////////////////////////
  // 3️⃣ Update request status
  //////////////////////////////////////////////////////

  await prisma.request.update({
    where: { id: requestId },
    data: {
      status: "COMPLETED",
    },
  });

  //////////////////////////////////////////////////////
  // 💳 FINALIZE BILL
  //////////////////////////////////////////////////////

  const bill = await prisma.bill.findFirst({
    where: { requestId },
  });

  if (bill) {
    await prisma.bill.update({
      where: { id: bill.id },
      data: {
        status: "GENERATED", // bill ready for payment
      },
    });
  }

  //////////////////////////////////////////////////////
  // RESPONSE
  //////////////////////////////////////////////////////

  return NextResponse.json({
    success: true,
    message: "Patient discharged and bill generated",
  });
}