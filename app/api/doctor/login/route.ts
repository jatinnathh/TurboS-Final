import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { NextResponse } from "next/server"

export async function POST(req: Request) {

  try {

    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      )
    }

    const doctor = await prisma.doctor.findUnique({
      where: { email }
    })

    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor not found" },
        { status: 404 }
      )
    }

    const valid = await bcrypt.compare(password, doctor.password)

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      )
    }

    // ✅ include role in token
    const token = jwt.sign(
      {
        doctorId: doctor.id,
        role: doctor.role
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    )

    const res = NextResponse.json({
      success: true,
      doctor: {
        id: doctor.id,
        role: doctor.role,
        name: doctor.name
      }
    })

    res.cookies.set("doctor_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24
    })

    return res

  } catch (error) {

    console.error(error)

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )

  }
}