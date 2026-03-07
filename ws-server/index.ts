
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";
import "dotenv/config"
const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
    console.error("❌ JWT_SECRET is not set in environment");
    process.exit(1);
}

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const io = new Server({
    cors: {
        origin: FRONTEND_URL,
        credentials: true,
    },
});

const PORT = Number(process.env.PORT) || 3001;
io.listen(PORT);

console.log(`🚀 WebSocket server running on port ${PORT}`);
console.log(`🌐 CORS origin: ${FRONTEND_URL}`);

// ─── Auth middleware ───────────────────────────────────
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("No auth token provided"));

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { doctorId: string };
        socket.data.doctorId = decoded.doctorId;
        next();
    } catch {
        next(new Error("Invalid token"));
    }
});

// ─── Helper: deterministic room ID ────────────────────
function getRoomId(dep1: string, dep2: string) {
    return [dep1, dep2]
        .map((d) => d.toLowerCase().replace(/\s+/g, "-"))
        .sort()
        .join("_");
}

// ─── Connection handler ───────────────────────────────
io.on("connection", async (socket) => {
    const doctorId = socket.data.doctorId;

    // Resolve doctor details
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
        socket.disconnect(true);
        return;
    }

    socket.data.doctor = doctor;

    // Auto-join notification channel for this department
    const notifyChannel = `notify:${doctor.department.toLowerCase().replace(/\s+/g, "-")}`;
    socket.join(notifyChannel);
    console.log(`✅ ${doctor.name} (${doctor.department}) connected → ${notifyChannel}`);

    // ─── Join a department room ─────────────────────────
    socket.on("join-room", async ({ targetDepartment }) => {
        const roomId = getRoomId(doctor.department, targetDepartment);
        socket.join(roomId);
        console.log(`📌 ${doctor.name} joined room: ${roomId}`);

        // Auto-create ChatRoom if doesn't exist
        const existing = await prisma.chatRoom.findFirst({
            where: {
                OR: [
                    { departmentA: doctor.department, departmentB: targetDepartment },
                    { departmentA: targetDepartment, departmentB: doctor.department },
                ],
            },
        });

        if (!existing) {
            await prisma.chatRoom.create({
                data: {
                    id: roomId,
                    departmentA: doctor.department,
                    departmentB: targetDepartment,
                },
            });
            console.log(`🆕 Created room: ${roomId}`);
        }

        // Send recent message history (last 50)
        const messages = await prisma.message.findMany({
            where: { roomId: existing?.id ?? roomId },
            orderBy: { createdAt: "asc" },
            take: 50,
        });
        socket.emit("message-history", messages);
    });

    // ─── Send a message ─────────────────────────────────
    socket.on("send-message", async ({ targetDepartment, content }) => {
        if (!content?.trim()) return;

        const roomId = getRoomId(doctor.department, targetDepartment);

        // Ensure room exists
        let room = await prisma.chatRoom.findFirst({
            where: {
                OR: [
                    { departmentA: doctor.department, departmentB: targetDepartment },
                    { departmentA: targetDepartment, departmentB: doctor.department },
                ],
            },
        });

        if (!room) {
            room = await prisma.chatRoom.create({
                data: {
                    id: roomId,
                    departmentA: doctor.department,
                    departmentB: targetDepartment,
                },
            });
        }

        const message = await prisma.message.create({
            data: {
                roomId: room.id,
                senderId: doctor.id,
                content: content.trim(),
            },
        });

        // Broadcast to room with sender info
        const payload = {
            ...message,
            senderName: doctor.name,
            senderDepartment: doctor.department,
        };

        io.to(roomId).emit("new-message", payload);

        // Broadcast notification to the TARGET department's notify channel
        const targetNotifyChannel = `notify:${targetDepartment.toLowerCase().replace(/\s+/g, "-")}`;
        socket.to(targetNotifyChannel).emit("chat-notification", {
            from: doctor.name,
            fromDepartment: doctor.department,
            content: content.trim().slice(0, 50),
        });

        console.log(`💬 ${doctor.name} → ${roomId}: ${content.trim().slice(0, 40)}`);
    });

    // ─── Typing indicator ──────────────────────────────
    socket.on("typing", ({ targetDepartment }) => {
        const roomId = getRoomId(doctor.department, targetDepartment);
        socket.to(roomId).emit("user-typing", {
            doctorName: doctor.name,
            department: doctor.department,
        });
    });

    socket.on("stop-typing", ({ targetDepartment }) => {
        const roomId = getRoomId(doctor.department, targetDepartment);
        socket.to(roomId).emit("user-stop-typing", {
            doctorName: doctor.name,
        });
    });

    socket.on("disconnect", () => {
        console.log(`❌ ${doctor.name} disconnected`);
    });
});
