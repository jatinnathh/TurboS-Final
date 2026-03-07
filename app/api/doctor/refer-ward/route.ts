import { prisma } from "@/lib/prisma";
import { getDoctorFromToken } from "@/lib/doctorAuth";
import { NextResponse } from "next/server";
import { CHARGES } from "@/lib/charges";

export async function POST(req: Request) {
  const doctor = await getDoctorFromToken();

  if (!doctor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId, ward } = await req.json();

  if (!requestId || !ward) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  //////////////////////////////////////////////////////
  // 🏥 Update Request (Admit Patient)
  //////////////////////////////////////////////////////

  const request = await prisma.request.update({
    where: { id: requestId },
    data: {
      wardType: ward,
      status: "IN_PROGRESS",
    },
  });

  //////////////////////////////////////////////////////
  // 💳 WARD BILLING LOGIC
  //////////////////////////////////////////////////////

  let wardCharge = 0;

  if (ward === "ICU") wardCharge = CHARGES.ICU_PER_DAY;
  if (ward === "General Ward") wardCharge = CHARGES.GENERAL_WARD_PER_DAY;
  if (ward === "Surgery Ward") wardCharge = CHARGES.SURGERY_WARD_PER_DAY;

  if (wardCharge > 0) {

    // 🔎 Find existing bill
    let bill = await prisma.bill.findFirst({
      where: { requestId },
    });

    // 🆕 Create bill if not exists
    if (!bill) {
      bill = await prisma.bill.create({
        data: {
          requestId,
          userId: request.userId,
          totalAmount: 0,
        },
      });
    }

    // ➕ Add ward bill item
    await prisma.billItem.create({
      data: {
        billId: bill.id,
        itemType: "WARD",
        description: `${ward} Admission`,
        amount: wardCharge,
      },
    });

    // 🔄 Update bill total
    await prisma.bill.update({
      where: { id: bill.id },
      data: {
        totalAmount: {
          increment: wardCharge,
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
      department: ward,
      action: `Admitted to ${ward}`,
      performedBy: doctor.name,
      status: "IN_PROGRESS",
    },
  });

  //////////////////////////////////////////////////////
  // RESPONSE
  //////////////////////////////////////////////////////

  return NextResponse.json({
    success: true,
  });
}