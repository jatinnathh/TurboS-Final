import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { CHARGES } from "@/lib/charges";

export async function POST(req: Request) {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let assignedDoctor = null;
  let status = "PENDING";

  //////////////////////////////////////////////////////
  // 🚨 EMERGENCY AUTO ASSIGN
  //////////////////////////////////////////////////////

  if (data.type === "EMERGENCY") {
    assignedDoctor = await prisma.doctor.findFirst({
      where: {
        department: "Emergency",
        available: true,
      },
    });

    if (!assignedDoctor) {
      return NextResponse.json(
        { error: "No emergency doctor available" },
        { status: 400 }
      );
    }

    status = "IN_PROGRESS";
  }

  //////////////////////////////////////////////////////
  // 📅 APPOINTMENT — Assign selected doctor
  //////////////////////////////////////////////////////

  if (data.type === "APPOINTMENT" && data.doctorId) {
    assignedDoctor = await prisma.doctor.findUnique({
      where: { id: data.doctorId },
    });

    if (!assignedDoctor) {
      return NextResponse.json(
        { error: "Selected doctor not found" },
        { status: 400 }
      );
    }

    status = "IN_PROGRESS";
  }

  //////////////////////////////////////////////////////
  // 1️⃣ CREATE REQUEST
  //////////////////////////////////////////////////////

  const request = await prisma.request.create({
    data: {
      type: data.type,
      title: data.title,
      description: data.description,
      department: data.department,
      priority: data.priority ?? "MEDIUM",
      doctorId: assignedDoctor?.id,
      doctorName: assignedDoctor?.name,
      appointmentDate: data.appointmentDate
        ? new Date(data.appointmentDate)
        : null,
      //@ts-ignore
      status,
      userId: dbUser.id,
    },
  });

  //////////////////////////////////////////////////////
  // 💳 AUTO CREATE BILL
  //////////////////////////////////////////////////////

  if (data.type === "APPOINTMENT" || data.type === "EMERGENCY") {
    const amount =
      data.type === "EMERGENCY"
        ? CHARGES.EMERGENCY
        : CHARGES.APPOINTMENT;

    await prisma.bill.create({
      data: {
        requestId: request.id,
        userId: dbUser.id,
        totalAmount: amount,

        items: {
          create: {
            itemType: data.type,
            description:
              data.type === "EMERGENCY"
                ? "Emergency Consultation"
                : "Doctor Appointment Booking",
            amount: amount,
          },
        },
      },
    });
  }

  //////////////////////////////////////////////////////
  // 2️⃣ TIMELINE LOG — REQUEST CREATED
  //////////////////////////////////////////////////////

  await prisma.requestLog.create({
    data: {
      requestId: request.id,
      department: data.department,
      action:
        data.type === "EMERGENCY"
          ? `Emergency request received — POST /api/request 200`
          : `${data.type.charAt(0) + data.type.slice(1).toLowerCase()} request submitted — POST /api/request 200`,
      performedBy: dbUser.email,
      status: "COMPLETED",
    },
  });

  //////////////////////////////////////////////////////
  // 3️⃣ TIMELINE LOG — DOCTOR ASSIGNED
  //////////////////////////////////////////////////////

  if (assignedDoctor) {
    await prisma.requestLog.create({
      data: {
        requestId: request.id,
        department: assignedDoctor.department,
        action: `Auto-assigned to ${assignedDoctor.name} (dept: ${assignedDoctor.department})`,
        performedBy: "System",
        status: "IN_PROGRESS",
      },
    });
  }

  //////////////////////////////////////////////////////
  // RESPONSE
  //////////////////////////////////////////////////////

  return NextResponse.json({
    success: true,
    requestId: request.id,
  });
}