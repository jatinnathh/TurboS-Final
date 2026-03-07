"use client";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ChatBadge() {
    const pathname = usePathname();
    const [unread, setUnread] = useState(0);
    const isOnChat = pathname === "/doctor/chat";
    const socketRef = useRef<Socket | null>(null);

    // Clear unread when navigating to chat
    useEffect(() => {
        if (isOnChat) setUnread(0);
    }, [isOnChat]);

    // Single socket connection with abort guard for StrictMode
    useEffect(() => {
        let aborted = false;

        fetch("/api/doctor/me", { credentials: "include" })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (aborted || !d?.token) return;

                const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";
                const s = io(wsUrl, {
                    auth: { token: d.token },
                    transports: ["websocket"],
                });

                socketRef.current = s;

                s.on("chat-notification", () => {
                    setUnread((prev) => prev + 1);
                });
            })
            .catch(() => { });

        return () => {
            aborted = true;
            socketRef.current?.disconnect();
            socketRef.current = null;
        };
    }, []);

    return (
        <Link
            href="/doctor/chat"
            onClick={() => setUnread(0)}
            className="relative flex items-center gap-1.5 text-sm text-sky-400 bg-sky-500/10 ring-1 ring-sky-500/30 hover:bg-sky-500/20 px-3 py-1.5 rounded-xl font-semibold transition-all"
        >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Chat
            {unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-rose-500 rounded-full px-1 shadow-lg shadow-rose-500/40 animate-pulse">
                    {unread > 99 ? "99+" : unread}
                </span>
            )}
        </Link>
    );
}
