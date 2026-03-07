import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { BillStatus } from "@prisma/client";

export async function POST(req: Request) {

  const { billId, amount } = await req.json();

  const bill = await prisma.bill.findUnique({
    where: { id: billId }
  });

  if (!bill) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  const newPaidAmount = bill.paidAmount + amount;

  let newStatus: BillStatus = BillStatus.GENERATED;

  if (newPaidAmount >= bill.totalAmount) {
    newStatus = BillStatus.PAID;
  }

  await prisma.bill.update({
    where: { id: billId },
    data: {
      paidAmount: newPaidAmount,
      status: newStatus
    }
  });

  return NextResponse.json({ success: true });
}