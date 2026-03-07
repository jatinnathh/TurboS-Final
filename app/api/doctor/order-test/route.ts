import { prisma } from "@/lib/prisma";
import { getDoctorFromToken } from "@/lib/doctorAuth";
import { NextResponse } from "next/server";
import { CHARGES } from "@/lib/charges";

export async function POST(req: Request) {
  const doctor = await getDoctorFromToken();

  if (!doctor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId, department, testType } = await req.json();

  if (!requestId || !department || !testType) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  //////////////////////////////////////////////////////
  // 🔬 Find lab doctor
  //////////////////////////////////////////////////////

  const labDoctor = await prisma.doctor.findFirst({
    where: { department },
  });

  if (!labDoctor) {
    return NextResponse.json(
      { error: "No lab doctor found" },
      { status: 400 }
    );
  }

  //////////////////////////////////////////////////////
  // 🧪 Create Lab Test
  //////////////////////////////////////////////////////

  const labTest = await prisma.labTest.create({
    data: {
      requestId,
      department,
      testType,
      labDoctorId: labDoctor.id,
      status: "PENDING",
    },
  });

  //////////////////////////////////////////////////////
  // 💳 BILLING LOGIC
  //////////////////////////////////////////////////////

const testCost =
  CHARGES.LAB_TEST[testType as keyof typeof CHARGES.LAB_TEST] ?? 1000;

  const bill = await prisma.bill.findFirst({
    where: { requestId },
  });

  if (bill) {
    // Create bill item
    await prisma.billItem.create({
      data: {
        billId: bill.id,
        itemType: "LAB_TEST",
        description: `${testType} (${department})`,
        amount: testCost,
      },
    });

    // Update total bill
    await prisma.bill.update({
      where: { id: bill.id },
      data: {
        totalAmount: {
          increment: testCost,
        },
      },
    });
  }

  //////////////////////////////////////////////////////
  // 📝 Timeline Log
  //////////////////////////////////////////////////////

  await prisma.requestLog.create({
    data: {
      requestId,
      department,
      action: `Lab test ordered: ${testType}`,
      performedBy: doctor.name,
      status: "IN_PROGRESS",
    },
  });

  //////////////////////////////////////////////////////
  // RESPONSE
  //////////////////////////////////////////////////////

  return NextResponse.json({
    success: true,
    labTest,
  });
}