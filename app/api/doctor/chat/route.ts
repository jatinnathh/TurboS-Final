import { prisma } from "@/lib/prisma";
import { getDoctorFromToken } from "@/lib/doctorAuth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const doctor = await getDoctorFromToken();
    if (!doctor) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roomId = req.nextUrl.searchParams.get("roomId");
    const list = req.nextUrl.searchParams.get("list");

    // List all rooms for the doctor's department
    if (list === "true") {
        const rooms = await prisma.chatRoom.findMany({
            where: {
                OR: [
                    { departmentA: doctor.department },
                    { departmentB: doctor.department },
                ],
            },
            include: {
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formatted = rooms.map((r: any) => ({
            id: r.id,
            otherDepartment:
                r.departmentA === doctor.department ? r.departmentB : r.departmentA,
            lastMessage: r.messages[0] ?? null,
            createdAt: r.createdAt,
        }));

        return NextResponse.json({ rooms: formatted });
    }

    // Get message history for a specific room
    if (roomId) {
        // Verify doctor's department is part of this room
        const room = await prisma.chatRoom.findFirst({
            where: {
                id: roomId,
                OR: [
                    { departmentA: doctor.department },
                    { departmentB: doctor.department },
                ],
            },
        });

        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        const messages = await prisma.message.findMany({
            where: { roomId },
            orderBy: { createdAt: "asc" },
            take: 100,
        });

        return NextResponse.json({ messages, room });
    }

    return NextResponse.json({ error: "Provide ?roomId or ?list=true" }, { status: 400 });
}
