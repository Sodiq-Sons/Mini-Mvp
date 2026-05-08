"use client";
import Link from "next/link";
import { memo } from "react";
import { Search } from "lucide-react";
import Avatar from "@/components/shared/Avatar";
import { useAuth } from "@/context/AuthContext";

// Inline the back arrow SVG to avoid importing all of lucide for one icon
const BackArrow = () => (
    <svg
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        aria-hidden="true"
    >
        <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
);

const TopHeader = memo(function TopHeader({
    title,
    showSearch = false,
    showBack = false,
    backHref = "/",
    right,
}) {
    const { profile } = useAuth();

    return (
        <header
            className="sticky top-0 z-40 border-b"
            style={{
                background: "rgba(255,253,248,0.92)",
                backdropFilter: "blur(12px)",
                borderColor: "#D6D3C9",
            }}
        >
            <div className="flex items-center h-14 px-4 max-w-2xl mx-auto gap-3">
                {showBack ? (
                    <Link
                        href={backHref}
                        className="p-2 -ml-2 rounded-xl"
                        aria-label="Go back"
                    >
                        <BackArrow />
                    </Link>
                ) : (
                    !title && (
                        <Link
                            href="/"
                            className="flex items-center gap-2 mr-auto"
                        >
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
                                style={{ background: "#556B2F" }}
                            >
                                ⛺
                            </div>
                            <span
                                className="font-display font-bold text-lg"
                                style={{ color: "#556B2F" }}
                            >
                                Camp Connect
                            </span>
                        </Link>
                    )
                )}

                {title && (
                    <h1
                        className="font-display font-bold text-lg flex-1"
                        style={{ color: "#1F2937" }}
                    >
                        {title}
                    </h1>
                )}

                <div className="flex items-center gap-2 ml-auto">
                    {right}
                    {showSearch && (
                        <Link
                            href="/search"
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: "#F3F0E8" }}
                            aria-label="Search"
                        >
                            <Search size={18} style={{ color: "#6B7280" }} />
                        </Link>
                    )}
                    {profile && (
                        <Link
                            href={`/profile/${profile.uid || ""}`}
                            aria-label="Your profile"
                        >
                            <Avatar
                                src={profile.photoURL}
                                name={profile.displayName}
                                size={34}
                            />
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
});

export default TopHeader;
