import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const department = searchParams.get("department");

  if (!department) {
    return NextResponse.json([]);
  }

  const doctors = await prisma.doctor.findMany({
    where: {
      department,
      available: true,
    },
    select: {
      id: true,
      name: true,
      specialization: true,
      department: true,
    },
  });

  return NextResponse.json(doctors);
}