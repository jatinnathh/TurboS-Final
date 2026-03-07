import { getDoctorFromToken } from "@/lib/doctorAuth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Lightweight endpoint: checks if a doctor is authenticated via JWT cookie
export async function GET() {
    const doctor = await getDoctorFromToken();
    if (!doctor) {
        return NextResponse.json({ authenticated: false });
    }

    // Also return the raw JWT token so the client can pass it to Socket.IO
    const cookieStore = await cookies();
    const token = cookieStore.get("doctor_token")?.value ?? null;

    return NextResponse.json({
        authenticated: true,
        doctorId: doctor.id,
        doctorName: doctor.name,
        department: doctor.department,
        token,
    });
}
