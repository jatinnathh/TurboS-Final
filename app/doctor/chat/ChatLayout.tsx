"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface ChatMessage {
    id: string;
    roomId: string;
    senderId: string;
    content: string;
    createdAt: string;
    senderName?: string;
    senderDepartment?: string;
}

interface ChatLayoutProps {
    doctorId: string;
    doctorName: string;
    doctorDepartment: string;
    departments: string[];
}

function getOtherDeptFromRoom(roomId: string, myDept: string) {
    const parts = roomId.split("_").map(p =>
        p.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    );
    return parts.find(p => p !== myDept) || null;
}
// Deterministic room ID (matches server logic)
function getRoomId(dep1: string, dep2: string) {
    return [dep1, dep2]
        .map((d) => d.toLowerCase().replace(/\s+/g, "-"))
        .sort()
        .join("_");
}

export default function ChatLayout({
    doctorId,
    doctorName,
    doctorDepartment,
    departments,
}: ChatLayoutProps) {
    const [activeDept, setActiveDept] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [text, setText] = useState("");
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const [unreadByDept, setUnreadByDept] = useState<Record<string, number>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const activeDeptRef = useRef<string | null>(null);

    // Keep ref in sync with state so socket callbacks see latest value
    useEffect(() => { activeDeptRef.current = activeDept; }, [activeDept]);

    // ─── Get JWT token from cookie (via API) ───────────
    const [token, setToken] = useState<string | null>(null);
    useEffect(() => {
        fetch("/api/doctor/me", { credentials: "include" })
            .then((r) => r.ok ? r.json() : null)
            .then((d) => {
                if (d?.authenticated) setToken(d.token);
            })
            .catch(() => { });
    }, []);

    // ─── Socket connection ─────────────────────────────
    useEffect(() => {
        if (!token) return;
        let aborted = false;

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";
        const s = io(wsUrl, {
            auth: { token },
            transports: ["websocket"],
            reconnectionAttempts: 5,
            timeout: 10000,
        });

        if (aborted) { s.disconnect(); return; }

        s.on("connect", () => {
            if (aborted) return;
            setConnected(true);
            // Auto-join ALL department rooms so we receive new-message for all
            departments.forEach((dept) => {
                s.emit("join-room", { targetDepartment: dept });
            });
        });
        s.on("disconnect", () => setConnected(false));

        s.on("message-history", (msgs: ChatMessage[]) => {
            // message-history is sent per room join — only use if active dept is set
            // (the last emitted history will override, which is fine for the re-join case)
            if (!aborted) setMessages(msgs);
        });

        s.on("new-message", (msg: ChatMessage) => {
            if (aborted) return;

            const activeRoom = activeDeptRef.current
                ? getRoomId(doctorDepartment, activeDeptRef.current)
                : null;

            // If message is for active room → show it
            if (activeRoom && msg.roomId === activeRoom) {
                setMessages((prev) => [...prev, msg]);
                return;
            }

            // Otherwise → unread
            const otherDept = getOtherDeptFromRoom(msg.roomId, doctorDepartment);
            if (otherDept) {
                setUnreadByDept((prev) => ({
                    ...prev,
                    [otherDept]: (prev[otherDept] || 0) + 1,
                }));
            }
        });

        s.on("user-typing", ({ doctorName: name }: { doctorName: string }) => {
            setTypingUser(name);
        });

        s.on("user-stop-typing", () => {
            setTypingUser(null);
        });

        setSocket(s);

        return () => {
            aborted = true;
            s.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // ─── Re-join and load history when active dept changes ─
    useEffect(() => {
        if (!socket || !activeDept) return;
        setMessages([]);
        socket.emit("join-room", { targetDepartment: activeDept });
    }, [socket, activeDept]);

    // ─── Auto-scroll ────────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ─── Send message ───────────────────────────────────
    const sendMessage = useCallback(() => {
        if (!socket || !activeDept || !text.trim()) return;
        socket.emit("send-message", {
            targetDepartment: activeDept,
            content: text.trim(),
        });
        setText("");
        socket.emit("stop-typing", { targetDepartment: activeDept });
    }, [socket, activeDept, text]);

    // ─── Typing indicator ──────────────────────────────
    const handleTyping = useCallback(() => {
        if (!socket || !activeDept) return;
        socket.emit("typing", { targetDepartment: activeDept });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stop-typing", { targetDepartment: activeDept });
        }, 2000);
    }, [socket, activeDept]);

    // ─── Department colors ─────────────────────────────
    const DEPT_COLORS: Record<string, string> = {
        Cardiology: "from-rose-500 to-pink-600",
        Neurology: "from-violet-500 to-purple-600",
        Pediatrics: "from-sky-500 to-blue-600",
        Orthopedics: "from-amber-500 to-orange-600",
        Emergency: "from-red-500 to-rose-600",
        Radiology: "from-teal-500 to-cyan-600",
        Pharmacy: "from-emerald-500 to-green-600",
        Laboratory: "from-indigo-500 to-blue-600",
        General: "from-slate-500 to-gray-600",
    };

    const getDeptGradient = (dept: string) =>
        DEPT_COLORS[dept] ?? "from-slate-500 to-gray-600";

    const getDeptInitial = (dept: string) => dept.charAt(0).toUpperCase();

    return (
        <div className="flex h-[calc(100vh-65px)]">
            {/* ── Sidebar: Department List ── */}
            <div className="w-72 border-r border-white/[0.06] bg-[#0a0f1a] flex flex-col">
                <div className="px-5 py-4 border-b border-white/[0.06]">
                    <h2 className="text-sm font-bold tracking-tight text-slate-200">
                        Department Chat
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-1">
                        {doctorDepartment} · {doctorName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                        <span
                            className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400 shadow-[0_0_6px_theme(colors.emerald.400)]" : "bg-rose-400"
                                }`}
                        />
                        <span className="text-[10px] text-slate-500">
                            {connected ? "Connected" : "Connecting…"}
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                    {departments.map((dept) => {
                        const count = unreadByDept[dept] || 0;
                        const hasUnread = count > 0;
                        return (
                            <button
                                key={dept}
                                onClick={() => {
                                    setActiveDept(dept);
                                    setUnreadByDept((prev) => ({ ...prev, [dept]: 0 }));
                                }}
                                className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-all group ${activeDept === dept
                                    ? "bg-white/[0.06] border-r-2 border-sky-400"
                                    : hasUnread
                                        ? "bg-sky-500/[0.06]"
                                        : "hover:bg-white/[0.03]"
                                    }`}
                            >
                                <div className="relative">
                                    <div
                                        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getDeptGradient(
                                            dept
                                        )} flex items-center justify-center text-sm font-bold text-white shadow-lg`}
                                    >
                                        {getDeptInitial(dept)}
                                    </div>
                                    {hasUnread && (
                                        <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center text-[9px] font-bold text-white bg-rose-500 rounded-full px-0.5 shadow-lg shadow-rose-500/40 animate-pulse">
                                            {count > 9 ? "9+" : count}
                                        </span>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p
                                        className={`text-sm truncate ${activeDept === dept
                                            ? "text-sky-400 font-semibold"
                                            : hasUnread
                                                ? "text-white font-bold"
                                                : "text-slate-300 font-semibold group-hover:text-white"
                                            }`}
                                    >
                                        {dept}
                                    </p>
                                    <p className={`text-[10px] truncate ${hasUnread ? "text-sky-400 font-medium" : "text-slate-600"
                                        }`}>
                                        {hasUnread ? `${count} new message${count > 1 ? "s" : ""}` : "Tap to chat"}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Chat Area ── */}
            <div className="flex-1 flex flex-col bg-[#080c14]">
                {!activeDept ? (
                    /* No department selected */
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500/20 to-violet-500/20 border border-white/[0.08] flex items-center justify-center">
                            <svg className="w-10 h-10 text-sky-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-slate-300">
                                Inter-Department Chat
                            </p>
                            <p className="text-sm text-slate-500 mt-1 max-w-xs">
                                Select a department to start a real-time conversation with doctors
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Chat header */}
                        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3 bg-[#0a0f1a]/60 backdrop-blur-sm">
                            <div
                                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getDeptGradient(
                                    activeDept
                                )} flex items-center justify-center text-sm font-bold text-white shadow-lg`}
                            >
                                {getDeptInitial(activeDept)}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-200">{activeDept}</p>
                                <p className="text-[11px] text-slate-500">
                                    {doctorDepartment} ↔ {activeDept}
                                </p>
                            </div>
                            <div className="ml-auto flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[10px] text-slate-500">Live</span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 custom-scrollbar">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                                    <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
                                        <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        No messages yet. Say hello to {activeDept}!
                                    </p>
                                </div>
                            )}

                            {messages.map((msg) => {
                                const isMine = msg.senderId === doctorId;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isMine
                                                ? "bg-sky-500/20 border border-sky-500/30 rounded-br-md"
                                                : "bg-white/[0.04] border border-white/[0.08] rounded-bl-md"
                                                }`}
                                        >
                                            {!isMine && (
                                                <p className="text-[10px] font-semibold text-sky-400 mb-1">
                                                    {msg.senderName ?? "Doctor"}
                                                </p>
                                            )}
                                            <p className="text-sm text-slate-200 leading-relaxed">
                                                {msg.content}
                                            </p>
                                            <p
                                                className={`text-[10px] mt-1.5 ${isMine ? "text-sky-400/50 text-right" : "text-slate-600"
                                                    }`}
                                            >
                                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}

                            {typingUser && (
                                <div className="flex items-center gap-2 text-slate-500 text-xs animate-pulse">
                                    <div className="flex gap-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                    {typingUser} is typing…
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message input */}
                        <div className="px-6 py-4 border-t border-white/[0.06] bg-[#0a0f1a]/60 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={text}
                                    onChange={(e) => {
                                        setText(e.target.value);
                                        handleTyping();
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            sendMessage();
                                        }
                                    }}
                                    placeholder={`Message ${activeDept}…`}
                                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/30 transition-all"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!text.trim()}
                                    className="w-10 h-10 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:bg-white/[0.04] disabled:text-slate-600 text-white flex items-center justify-center transition-all shadow-lg shadow-sky-500/20 disabled:shadow-none"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
