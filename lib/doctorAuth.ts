import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"

export async function getDoctorFromToken() {

  const cookieStore = await cookies()   // ✅ Next.js 16 fix
  const token = cookieStore.get("doctor_token")?.value

  if (!token) return null

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as { doctorId: string }

    const doctor = await prisma.doctor.findUnique({
      where: { id: decoded.doctorId }
    })

    return doctor

  } catch {
    return null
  }
}


export async function getAdminFromToken() {

  const doctor = await getDoctorFromToken()

  if (!doctor || doctor.role !== "ADMIN") {
    return null
  }

  return doctor
}