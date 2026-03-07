import { prisma } from "@/lib/prisma";
import { getDoctorFromToken } from "@/lib/doctorAuth";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const doctorId = req.nextUrl.searchParams.get("doctorId");

    // Doctor context: resolve doctor either from query param or from JWT cookie
    const doctorFromToken = await getDoctorFromToken();
    const resolvedDoctorId = doctorId ?? doctorFromToken?.id ?? null;

    if (resolvedDoctorId) {
        const doctor = await prisma.doctor.findUnique({ where: { id: resolvedDoctorId } });
        if (!doctor) {
            return NextResponse.json({ logs: [] });
        }

        const logs = await prisma.requestLog.findMany({
            where: {
                request: {
                    OR: [
                        { doctorId: doctor.id },
                        { logs: { some: { performedBy: doctor.name } } },
                    ],
                },
            },
            orderBy: { createdAt: "desc" },
            include: {
                request: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        status: true,
                        priority: true,
                        department: true,
                    },
                },
            },
        });

        return NextResponse.json({ logs });
    }

    // Patient context: use Clerk auth
    const user_clerk = await currentUser();
    if (!user_clerk) {
        return NextResponse.json({ logs: [] });
    }

    const user = await prisma.user.findUnique({
        where: { clerkId: user_clerk.id },
    });

    if (!user) {
        return NextResponse.json({ logs: [] });
    }

    const logs = await prisma.requestLog.findMany({
        where: { request: { userId: user.id } },
        orderBy: { createdAt: "desc" },
        include: {
            request: {
                select: {
                    id: true,
                    title: true,
                    type: true,
                    status: true,
                    priority: true,
                    department: true,
                },
            },
        },
    });

    return NextResponse.json({ logs });
}
