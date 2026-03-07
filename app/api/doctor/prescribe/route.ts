import { prisma } from "@/lib/prisma";
import { getDoctorFromToken } from "@/lib/doctorAuth";
import { NextResponse } from "next/server";
import { CHARGES } from "@/lib/charges";

export async function POST(req: Request) {
  const doctor = await getDoctorFromToken();

  if (!doctor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId, medication, dosage, frequency } = await req.json();

  if (!requestId || !medication || !dosage || !frequency) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

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
  // 🔐 Ensure doctor is assigned
  //////////////////////////////////////////////////////

  if (request.doctorId !== doctor.id) {
    return NextResponse.json(
      { error: "You are not assigned to this case" },
      { status: 403 }
    );
  }

  //////////////////////////////////////////////////////
  // 💊 Create Prescription
  //////////////////////////////////////////////////////

  await prisma.prescription.create({
    data: {
      medication,
      dosage,
      frequency,
      startDate: new Date(),
      doctorId: doctor.id,
      userId: request.userId,
      requestId: request.id,
    },
  });

  //////////////////////////////////////////////////////
  // 💳 BILLING LOGIC
  //////////////////////////////////////////////////////

  const bill = await prisma.bill.findFirst({
    where: { requestId },
  });

  if (bill) {
    // Add bill item
    await prisma.billItem.create({
      data: {
        billId: bill.id,
        itemType: "PRESCRIPTION",
        description: medication,
        amount: CHARGES.PRESCRIPTION,
      },
    });

    // Update total bill
    await prisma.bill.update({
      where: { id: bill.id },
      data: {
        totalAmount: {
          increment: CHARGES.PRESCRIPTION,
        },
      },
    });
  }

  //////////////////////////////////////////////////////
  // 📝 Timeline Log
  //////////////////////////////////////////////////////

  await prisma.requestLog.create({
    data: {
      requestId: request.id,
      department: request.department || "",
      action: `Prescription added: ${medication}`,
      performedBy: doctor.name,
      status: "COMPLETED",
    },
  });

  //////////////////////////////////////////////////////
  // RESPONSE
  //////////////////////////////////////////////////////

  return NextResponse.json({
    success: true,
  });
}