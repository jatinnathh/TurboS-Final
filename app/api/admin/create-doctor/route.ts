import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {

    const { name, email, password, department } = await req.json()

    // Validate fields
    if (!name || !email || !password || !department) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Check if doctor already exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { email }
    })

    if (existingDoctor) {
      return NextResponse.json(
        { error: "Doctor with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create doctor
    const doctor = await prisma.doctor.create({
      data: {
        name,
        email,
        password: hashedPassword,
        department,
        specialization: department,
        role: "DOCTOR"
      }
    })

    return NextResponse.json({
      success: true,
      doctor
    })

  } catch (error) {

    console.error(error)

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}