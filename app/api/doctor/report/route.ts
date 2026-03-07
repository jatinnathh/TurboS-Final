import { prisma } from "@/lib/prisma";
import { getDoctorFromToken } from "@/lib/doctorAuth";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET  /api/doctor/report?requestId=xxx  — fetch report for a request
 * POST /api/doctor/report               — create or update report
 */

export async function GET(req: NextRequest) {
    const requestId = req.nextUrl.searchParams.get("requestId");
    if (!requestId) {
        return NextResponse.json({ error: "requestId required" }, { status: 400 });
    }

    const report = await prisma.doctorReport.findUnique({
        where: { requestId },
    });

    return NextResponse.json(report);
}

export async function POST(req: Request) {
    const doctor = await getDoctorFromToken();
    if (!doctor) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { requestId, ...fields } = data;

    if (!requestId) {
        return NextResponse.json({ error: "requestId required" }, { status: 400 });
    }

    // Upsert: create if not exists, update if exists
    const report = await prisma.doctorReport.upsert({
        where: { requestId },
        create: {
            requestId,
            doctorId: doctor.id,
            patientName: fields.patientName ?? "",
            date: fields.date ?? new Date().toISOString().split("T")[0],
            age: fields.age,
            gender: fields.gender,
            vitalsBp: fields.vitalsBp,
            vitalsPulse: fields.vitalsPulse,
            vitalsTemp: fields.vitalsTemp,
            vitalsWeight: fields.vitalsWeight,
            symptoms: fields.symptoms, // JSON string
            diagnosis: fields.diagnosis,
            medications: fields.medications, // JSON string
            advice: fields.advice,
            nextVisit: fields.nextVisit,
        },
        update: {
            patientName: fields.patientName,
            date: fields.date,
            age: fields.age,
            gender: fields.gender,
            vitalsBp: fields.vitalsBp,
            vitalsPulse: fields.vitalsPulse,
            vitalsTemp: fields.vitalsTemp,
            vitalsWeight: fields.vitalsWeight,
            symptoms: fields.symptoms,
            diagnosis: fields.diagnosis,
            medications: fields.medications,
            advice: fields.advice,
            nextVisit: fields.nextVisit,
        },
    });

    return NextResponse.json(report);
}
