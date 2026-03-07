import { prisma } from "@/lib/prisma"
import { getAdminFromToken } from "@/lib/doctorAuth"
import { NextResponse } from "next/server"

export async function POST(req: Request) {

  const admin = await getAdminFromToken()

  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {

    const { id, name, department } = await req.json()

    if (!id) {
      return NextResponse.json(
        { error: "Doctor ID required" },
        { status: 400 }
      )
    }

    const doctor = await prisma.doctor.update({
      where: { id },
      data: {
        name,
        department
      }
    })

    return NextResponse.json({
      success: true,
      doctor
    })

  } catch (error) {

    console.error(error)

    return NextResponse.json(
      { error: "Failed to update doctor" },
      { status: 500 }
    )
  }
}