import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/request/booked-slots?doctorId=xxx&date=YYYY-MM-DD
 *
 * Returns the list of already-booked time-slot strings
 * (e.g. ["09-10", "14-15"]) for a given doctor on a given date.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date"); // expected YYYY-MM-DD

    if (!doctorId || !date) {
        return NextResponse.json(
            { error: "doctorId and date are required" },
            { status: 400 }
        );
    }

    // Build day boundaries in UTC
    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);

    const requests = await prisma.request.findMany({
        where: {
            doctorId,
            appointmentDate: {
                gte: dayStart,
                lte: dayEnd,
            },
            status: {
                notIn: ["REJECTED", "COMPLETED"],
            },
        },
        select: {
            appointmentDate: true,
        },
    });

    // Convert each appointmentDate hour → slot string like "09-10"
    const bookedSlots = requests
        .filter((r) => r.appointmentDate !== null)
        .map((r) => {
            const hour = r.appointmentDate!.getHours();
            const padded = String(hour).padStart(2, "0");
            const next = String(hour + 1).padStart(2, "0");
            return `${padded}-${next}`;
        });

    return NextResponse.json(bookedSlots);
}
