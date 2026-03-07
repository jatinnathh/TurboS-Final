import { prisma } from "@/lib/prisma";
import { getDoctorFromToken } from "@/lib/doctorAuth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
 const doctor = await getDoctorFromToken();

if (!doctor) {
  return new Response(
    JSON.stringify({ error: "Unauthorized" }),
    { status: 401 }
  );
}

    const { labTestId, result } = await req.json();

    if (!labTestId || !result) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const existing = await prisma.labTest.findUnique({
      where: { id: labTestId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Lab test not found" },
        { status: 404 }
      );
    }

    await prisma.labTest.update({
      where: { id: labTestId },
      data: {
        result,
        status: "COMPLETED",
      },
    });

    await prisma.requestLog.create({
      data: {
        requestId: existing.requestId,
        department: existing.department,
        action: `Lab result published`,
        performedBy: doctor.name,
        status: "COMPLETED",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Publish Error:", error);
    return NextResponse.json(
      { error: "Server crashed" },
      { status: 500 }
    );
  }
}