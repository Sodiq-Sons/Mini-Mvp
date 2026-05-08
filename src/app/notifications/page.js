"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
    ThumbsUp,
    MessageCircle,
    BarChart2,
    Bell,
    BellOff,
    CheckCheck,
    Loader2,
    AtSign,
    Flame,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import Avatar from "@/components/shared/Avatar";
import {
    getNotifications,
    markNotificationRead,
    subscribeToNotifications,
} from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

const NOTIF_CONFIG = {
    like: {
        icon: ThumbsUp,
        color: "#556B2F",
        bg: "#EDF2E8",
        label: "liked your post",
    },
    comment: {
        icon: MessageCircle,
        color: "#3B82F6",
        bg: "#DBEAFE",
        label: "commented on your post",
    },
    vote: {
        icon: BarChart2,
        color: "#F59E0B",
        bg: "#FEF3C7",
        label: "voted on your poll",
    },
    mention: {
        icon: AtSign,
        color: "#8B5CF6",
        bg: "#EDE9FE",
        label: "mentioned you",
    },
    trending: {
        icon: Flame,
        color: "#EF4444",
        bg: "#FEE2E2",
        label: "Your post is trending!",
    },
    reply: {
        icon: MessageCircle,
        color: "#10B981",
        bg: "#D1FAE5",
        label: "replied to your comment",
    },
};

function NotifItem({ notif, onRead }) {
    const config = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.like;
    const Icon = config.icon;
    const time = notif.createdAt?.toDate
        ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })
        : "recently";

    const inner = (
        <div
            onClick={() => !notif.read && onRead(notif.id)}
            className="flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer"
            style={{
                background: notif.read ? "#FFFDF8" : "#F0F5EB",
                borderColor: notif.read ? "#D6D3C9" : "#C8D8B8",
            }}
        >
            <div className="relative flex-shrink-0">
                <Avatar
                    src={notif.fromPhotoURL}
                    name={notif.fromName}
                    size={40}
                />
                <div
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                        background: config.bg,
                        border: "1.5px solid white",
                    }}
                >
                    <Icon size={10} style={{ color: config.color }} />
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: "#1F2937" }}>
                    <span className="font-bold">
                        {notif.fromName || "Someone"}
                    </span>{" "}
                    <span style={{ color: "#6B7280" }}>{config.label}</span>
                </p>
                {notif.postTitle && (
                    <p
                        className="text-xs mt-0.5 truncate font-medium"
                        style={{ color: "#556B2F" }}
                    >
                        &quot;{notif.postTitle}&quot;
                    </p>
                )}
                <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                    {time}
                </p>
            </div>
            {!notif.read && (
                <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                    style={{ background: "#556B2F" }}
                />
            )}
        </div>
    );

    if (notif.postId)
        return <Link href={`/post/${notif.postId}`}>{inner}</Link>;
    return inner;
}

function NotifGroup({ label, items, onRead }) {
    if (items.length === 0) return null;
    return (
        <div className="mb-4">
            <h3
                className="text-xs font-bold mb-2 px-1 uppercase tracking-wider"
                style={{ color: "#6B7280" }}
            >
                {label}
            </h3>
            <div className="flex flex-col gap-2">
                {items.map((n) => (
                    <NotifItem key={n.id} notif={n} onRead={onRead} />
                ))}
            </div>
        </div>
    );
}

export default function NotificationsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);

    useEffect(() => {
        if (!user) {
            router.replace("/auth/login");
            return;
        }
        const load = async () => {
            const notifs = await getNotifications(user.uid, 50);
            setNotifications(notifs);
            setLoading(false);
        };
        load();

        // Real-time unread updates
        const unsub = subscribeToNotifications(user.uid, (newUnread) => {
            setNotifications((prev) => {
                const ids = new Set(newUnread.map((n) => n.id));
                const existing = prev.filter((n) => !ids.has(n.id));
                return [...newUnread, ...existing];
            });
        });
        return unsub;
    }, [user, router]);

    const handleRead = async (id) => {
        await markNotificationRead(id);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
    };

    const handleMarkAll = async () => {
        setMarkingAll(true);
        const unread = notifications.filter((n) => !n.read);
        await Promise.all(unread.map((n) => markNotificationRead(n.id)));
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setMarkingAll(false);
        toast.success("All marked as read");
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    // Group by time
    const now = Date.now();
    const today = notifications.filter((n) => {
        const t = n.createdAt?.toDate?.()?.getTime() || 0;
        return now - t < 86400000;
    });
    const earlier = notifications.filter((n) => {
        const t = n.createdAt?.toDate?.()?.getTime() || 0;
        return now - t >= 86400000;
    });

    return (
        <AppShell
            title="Notifications"
            headerRight={
                unreadCount > 0 && (
                    <button
                        onClick={handleMarkAll}
                        disabled={markingAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                        style={{ background: "#EDF2E8", color: "#556B2F" }}
                    >
                        {markingAll ? (
                            <Loader2 size={12} className="animate-spin" />
                        ) : (
                            <CheckCheck size={12} />
                        )}
                        Mark all read
                    </button>
                )
            }
        >
            <div className="px-4 py-4">
                {/* Unread badge */}
                {unreadCount > 0 && (
                    <div
                        className="flex items-center gap-2 mb-4 p-3 rounded-2xl"
                        style={{
                            background: "#EDF2E8",
                            border: "1px solid #C8D8B8",
                        }}
                    >
                        <Bell size={16} style={{ color: "#556B2F" }} />
                        <span
                            className="text-sm font-bold"
                            style={{ color: "#556B2F" }}
                        >
                            {unreadCount} unread notification
                            {unreadCount > 1 ? "s" : ""}
                        </span>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2
                            size={28}
                            className="animate-spin"
                            style={{ color: "#556B2F" }}
                        />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-20">
                        <BellOff
                            size={48}
                            className="mx-auto mb-3"
                            style={{ color: "#D6D3C9" }}
                        />
                        <h3
                            className="font-bold text-base"
                            style={{ color: "#1F2937" }}
                        >
                            No notifications yet
                        </h3>
                        <p
                            className="text-sm mt-1"
                            style={{ color: "#6B7280" }}
                        >
                            When people interact with your posts, you&apos;ll
                            see it here
                        </p>
                        <Link
                            href="/feed"
                            className="mt-4 inline-block px-6 py-2.5 rounded-2xl font-bold text-sm text-white"
                            style={{ background: "#556B2F" }}
                        >
                            Explore Feed
                        </Link>
                    </div>
                ) : (
                    <>
                        <NotifGroup
                            label="Today"
                            items={today}
                            onRead={handleRead}
                        />
                        <NotifGroup
                            label="Earlier"
                            items={earlier}
                            onRead={handleRead}
                        />
                    </>
                )}
            </div>
        </AppShell>
    );
}
