"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo } from "react";
import { Home, Flame, PlusCircle, Bell, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

const BottomNav = memo(function BottomNav() {
    const pathname = usePathname();
    const { user } = useAuth();
    const { unreadCount } = useNotifications();

    if (!user) return null;

    const NAV_ITEMS = [
        { href: "/", icon: Home, label: "Home" },
        { href: "/trending", icon: Flame, label: "Trending" },
        { href: "/create", icon: PlusCircle, label: "Post", accent: true },
        {
            href: "/notifications",
            icon: Bell,
            label: "Alerts",
            badge: unreadCount,
        },
        { href: `/profile/${user.uid}`, icon: User, label: "Profile" },
    ];

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 border-t"
            style={{
                background: "#FFFDF8",
                borderColor: "#D6D3C9",
                paddingBottom: "env(safe-area-inset-bottom)",
            }}
        >
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
                {NAV_ITEMS.map(({ href, icon: Icon, label, accent, badge }) => {
                    const active =
                        pathname === href || pathname.startsWith(href + "/");
                    return (
                        <Link
                            key={href}
                            href={href}
                            className="flex flex-col items-center gap-0.5 flex-1 py-2"
                            aria-label={label}
                        >
                            {accent ? (
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #556B2F, #3E5F44)",
                                        marginTop: -20,
                                    }}
                                >
                                    <Icon
                                        size={22}
                                        color="white"
                                        strokeWidth={2}
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="relative">
                                        <Icon
                                            size={22}
                                            strokeWidth={active ? 2.5 : 1.8}
                                            style={{
                                                color: active
                                                    ? "#556B2F"
                                                    : "#6B7280",
                                            }}
                                        />
                                        {badge > 0 && (
                                            <div
                                                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                                                style={{
                                                    background: "#EF4444",
                                                }}
                                            >
                                                {badge > 9 ? "9+" : badge}
                                            </div>
                                        )}
                                    </div>
                                    <span
                                        className="text-[10px] font-semibold"
                                        style={{
                                            color: active
                                                ? "#556B2F"
                                                : "#6B7280",
                                        }}
                                    >
                                        {label}
                                    </span>
                                    {active && (
                                        <div
                                            className="w-1 h-1 rounded-full"
                                            style={{ background: "#556B2F" }}
                                        />
                                    )}
                                </>
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
});

export default BottomNav;
