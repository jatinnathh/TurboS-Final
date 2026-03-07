import { prisma } from "@/lib/prisma";
import { getDoctorFromToken } from "@/lib/doctorAuth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const doctor = await getDoctorFromToken();

    if (!doctor) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    // 🔍 Find request
    const request = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    // 🔐 Ensure this doctor owns the case
    if (request.doctorId !== doctor.id) {
      return NextResponse.json(
        { error: "You are not assigned to this case" },
        { status: 403 }
      );
    }

    // ❌ Prevent admitting completed case
    if (request.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot admit a completed case" },
        { status: 400 }
      );
    }

    // ✅ Update request status
    await prisma.request.update({
      where: { id: requestId },
      data: {
        status: "IN_PROGRESS",
      },
    });

    // 📝 Add timeline log
    await prisma.requestLog.create({
      data: {
        requestId,
        department: request.department ?? "General",
        action: "Patient admitted for further care",
        performedBy: doctor.name,
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Admit Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}