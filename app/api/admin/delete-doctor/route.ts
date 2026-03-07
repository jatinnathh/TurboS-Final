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

    const { id } = await req.json()

    if (!id) {
      return NextResponse.json(
        { error: "Doctor ID required" },
        { status: 400 }
      )
    }

    await prisma.doctor.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: "Doctor deleted successfully"
    })

  } catch (error) {

    console.error(error)

    return NextResponse.json(
      { error: "Failed to delete doctor" },
      { status: 500 }
    )
  }
}