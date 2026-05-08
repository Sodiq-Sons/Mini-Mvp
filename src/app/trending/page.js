"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
    Flame,
    TrendingUp,
    Users,
    Shield,
    ThumbsUp,
    MessageCircle,
    BarChart2,
    Loader2,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import Avatar from "@/components/shared/Avatar";
import VerifiedBadge from "@/components/shared/VerifiedBadge";
import CategoryPill from "@/components/shared/CategoryPill";
import {
    getTrendingPosts,
    getTrendingUsers,
    getTrendingPlatoons,
} from "@/lib/firestore";

function TrendingUserCard({ user, rank }) {
    const rankColors = ["#F59E0B", "#6B7280", "#CD7F32"];
    const isTop3 = rank <= 3;
    return (
        <Link href={`/profile/${user.id}`}>
            <div
                className="flex items-center gap-3 p-3 rounded-2xl border transition-all hover:shadow-md"
                style={{ background: "#FFFDF8", borderColor: "#D6D3C9" }}
            >
                <div className="relative">
                    <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black absolute -top-1 -left-1 z-10`}
                        style={{
                            background: isTop3
                                ? rankColors[rank - 1]
                                : "#D6D3C9",
                            color: "white",
                            fontSize: 10,
                        }}
                    >
                        {rank}
                    </div>
                    <Avatar
                        src={user.photoURL}
                        name={user.displayName}
                        size={44}
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                        <span
                            className="font-bold text-sm truncate"
                            style={{ color: "#1F2937" }}
                        >
                            {user.displayName}
                        </span>
                        {user.verified && <VerifiedBadge size={13} />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {user.campLocation && (
                            <span
                                className="text-[10px]"
                                style={{ color: "#6B7280" }}
                            >
                                {user.campLocation?.split(" ")[0]}
                            </span>
                        )}
                        {user.platoonNumber && (
                            <span
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                style={{
                                    background: "#EDF2E8",
                                    color: "#556B2F",
                                }}
                            >
                                P{user.platoonNumber}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div
                        className="flex items-center gap-1 text-xs font-bold"
                        style={{ color: "#556B2F" }}
                    >
                        <ThumbsUp size={11} />
                        {user.likeCount || 0}
                    </div>
                    <div
                        className="flex items-center gap-1 text-xs"
                        style={{ color: "#6B7280" }}
                    >
                        <MessageCircle size={11} />
                        {user.commentCount || 0}
                    </div>
                </div>
            </div>
        </Link>
    );
}

function TrendingPostCard({ post, rank }) {
    const time = post.createdAt?.toDate
        ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true })
        : "recently";
    return (
        <Link href={`/post/${post.id}`}>
            <div
                className="flex items-start gap-3 p-3 rounded-2xl border transition-all hover:shadow-md"
                style={{ background: "#FFFDF8", borderColor: "#D6D3C9" }}
            >
                <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
                    style={{
                        background: rank <= 3 ? "#556B2F" : "#F3F0E8",
                        color: rank <= 3 ? "white" : "#6B7280",
                    }}
                >
                    {rank}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <CategoryPill category={post.category} size="xs" />
                        <span className="text-xs" style={{ color: "#6B7280" }}>
                            {time}
                        </span>
                    </div>
                    <h4
                        className="font-bold text-sm leading-snug line-clamp-2"
                        style={{ color: "#1F2937" }}
                    >
                        {post.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1.5">
                        <span
                            className="flex items-center gap-1 text-xs font-semibold"
                            style={{ color: "#556B2F" }}
                        >
                            <Flame size={11} />
                            {post.trendScore || 0}
                        </span>
                        <span
                            className="flex items-center gap-1 text-xs"
                            style={{ color: "#6B7280" }}
                        >
                            <ThumbsUp size={11} />
                            {post.likeCount || 0}
                        </span>
                        <span
                            className="flex items-center gap-1 text-xs"
                            style={{ color: "#6B7280" }}
                        >
                            <MessageCircle size={11} />
                            {post.commentCount || 0}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

function PlatoonCard({ platoon, count, rank }) {
    return (
        <div
            className="flex items-center gap-3 p-3 rounded-2xl border"
            style={{ background: "#FFFDF8", borderColor: "#D6D3C9" }}
        >
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-black"
                style={{
                    background:
                        rank <= 3
                            ? "linear-gradient(135deg,#F59E0B,#D97706)"
                            : "#F3F0E8",
                    color: rank <= 3 ? "white" : "#6B7280",
                }}
            >
                <Shield size={18} />
            </div>
            <div className="flex-1">
                <div className="font-bold text-sm" style={{ color: "#1F2937" }}>
                    Platoon {platoon}
                </div>
                <div className="text-xs" style={{ color: "#6B7280" }}>
                    {count} posts this week
                </div>
            </div>
            <div
                className="text-xs font-black"
                style={{ color: rank <= 3 ? "#F59E0B" : "#D6D3C9" }}
            >
                #{rank}
            </div>
        </div>
    );
}

const TABS = [
    { key: "posts", label: "Posts", icon: TrendingUp },
    { key: "users", label: "Users", icon: Users },
    { key: "platoons", label: "Platoons", icon: Shield },
];

export default function TrendingPage() {
    const [tab, setTab] = useState("posts");
    const [trendingPosts, setTrendingPosts] = useState([]);
    const [trendingUsers, setTrendingUsers] = useState([]);
    const [trendingPlatoons, setTrendingPlatoons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const [posts, users, platoons] = await Promise.all([
                getTrendingPosts(15),
                getTrendingUsers(15),
                getTrendingPlatoons(),
            ]);
            setTrendingPosts(posts);
            setTrendingUsers(users);
            setTrendingPlatoons(platoons);
            setLoading(false);
        };
        load();
    }, []);

    return (
        <AppShell title="Trending">
            <div className="px-4 py-4">
                {/* Header card */}
                <div
                    className="rounded-2xl p-4 mb-4"
                    style={{
                        background: "linear-gradient(135deg,#556B2F,#3E5F44)",
                    }}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <Flame size={20} color="white" />
                        <h2 className="font-display font-bold text-lg text-white">
                            What&apos;s Hot 🔥
                        </h2>
                    </div>
                    <p className="text-sm text-white/70">
                        Most active corps members, platoons & posts
                    </p>
                </div>

                {/* Tabs */}
                <div
                    className="flex gap-1 p-1 rounded-2xl mb-4"
                    style={{
                        background: "#FFFDF8",
                        border: "1px solid #D6D3C9",
                    }}
                >
                    {TABS.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
                            style={{
                                background:
                                    tab === key ? "#556B2F" : "transparent",
                                color: tab === key ? "white" : "#6B7280",
                            }}
                        >
                            <Icon size={13} />
                            {label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2
                            size={28}
                            className="animate-spin"
                            style={{ color: "#556B2F" }}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col gap-2.5">
                        {tab === "posts" &&
                            (trendingPosts.length === 0 ? (
                                <EmptyState
                                    emoji="📊"
                                    text="No trending posts yet"
                                />
                            ) : (
                                trendingPosts.map((p, i) => (
                                    <TrendingPostCard
                                        key={p.id}
                                        post={p}
                                        rank={i + 1}
                                    />
                                ))
                            ))}
                        {tab === "users" &&
                            (trendingUsers.length === 0 ? (
                                <EmptyState emoji="👤" text="No users yet" />
                            ) : (
                                trendingUsers.map((u, i) => (
                                    <TrendingUserCard
                                        key={u.id}
                                        user={u}
                                        rank={i + 1}
                                    />
                                ))
                            ))}
                        {tab === "platoons" &&
                            (trendingPlatoons.length === 0 ? (
                                <EmptyState
                                    emoji="🏕️"
                                    text="No platoon data yet"
                                />
                            ) : (
                                trendingPlatoons.map(
                                    ({ platoon, count }, i) => (
                                        <PlatoonCard
                                            key={platoon}
                                            platoon={platoon}
                                            count={count}
                                            rank={i + 1}
                                        />
                                    ),
                                )
                            ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}

function EmptyState({ emoji, text }) {
    return (
        <div className="text-center py-16">
            <div className="text-5xl mb-3">{emoji}</div>
            <p className="text-sm" style={{ color: "#6B7280" }}>
                {text}
            </p>
        </div>
    );
}
