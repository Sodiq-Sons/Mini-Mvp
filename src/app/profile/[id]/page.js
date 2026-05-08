"use client";
import { useState, useEffect, use, memo, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import {
    Settings,
    MapPin,
    GraduationCap,
    Shield,
    Heart,
    MessageCircle,
    BarChart2,
    FileText,
    BadgeCheck,
    Loader2,
} from "lucide-react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import Avatar from "@/components/shared/Avatar";
import VerifiedBadge from "@/components/shared/VerifiedBadge";
import PostCard from "@/components/feed/PostCard";
import { getUserById, getUserPosts } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";

const StatCard = memo(function StatCard({
    icon: Icon,
    label,
    value,
    color = "#556B2F",
}) {
    return (
        <div
            className="flex flex-col items-center gap-1 p-3 rounded-2xl border"
            style={{ background: "#FFFDF8", borderColor: "#D6D3C9", flex: 1 }}
        >
            <Icon size={18} style={{ color }} aria-hidden="true" />
            <span
                className="font-display font-bold text-lg"
                style={{ color: "#1F2937" }}
            >
                {value ?? 0}
            </span>
            <span
                className="text-[10px] font-semibold text-center"
                style={{ color: "#6B7280" }}
            >
                {label}
            </span>
        </div>
    );
});

const MetaTag = memo(function MetaTag({ icon: Icon, text, bg, color }) {
    if (!text) return null;
    return (
        <div
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full"
            style={{ background: bg, color }}
        >
            {Icon && <Icon size={11} aria-hidden="true" />} {text}
        </div>
    );
});

export default function ProfilePage({ params }) {
    const { id } = use(params);
    const { user } = useAuth();
    const isOwnProfile = user?.uid === id;

    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [tab, setTab] = useState("posts");

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            // Load profile and first page of posts in parallel
            const [p, postsResult] = await Promise.all([
                getUserById(id),
                getUserPosts(id, null, 8),
            ]);
            if (cancelled) return;
            setProfile(p);
            setPosts(postsResult.posts);
            setLastDoc(postsResult.lastDoc);
            setHasMore(postsResult.hasMore);
            setLoading(false);
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [id]);

    const loadMorePosts = useCallback(async () => {
        if (!hasMore || loadingPosts) return;
        setLoadingPosts(true);
        const {
            posts: more,
            lastDoc: ld,
            hasMore: hm,
        } = await getUserPosts(id, lastDoc, 8);
        setPosts((prev) => [...prev, ...more]);
        setLastDoc(ld);
        setHasMore(hm);
        setLoadingPosts(false);
    }, [id, lastDoc, hasMore, loadingPosts]);

    if (loading)
        return (
            <AppShell showBack backHref="/feed">
                <div className="flex justify-center py-20">
                    <Loader2
                        size={28}
                        className="animate-spin"
                        style={{ color: "#556B2F" }}
                        aria-label="Loading profile"
                    />
                </div>
            </AppShell>
        );

    if (!profile)
        return (
            <AppShell showBack backHref="/feed" title="Profile">
                <div className="text-center py-20">
                    <div className="text-5xl mb-3" aria-hidden="true">
                        👤
                    </div>
                    <p className="font-bold" style={{ color: "#1F2937" }}>
                        User not found
                    </p>
                </div>
            </AppShell>
        );

    const joinDate = profile.createdAt?.toDate
        ? formatDistanceToNow(profile.createdAt.toDate(), { addSuffix: true })
        : "recently";

    return (
        <AppShell
            showBack
            backHref="/feed"
            headerRight={
                isOwnProfile ? (
                    <Link
                        href="/settings"
                        className="p-2 rounded-xl"
                        style={{ background: "#F3F0E8" }}
                        aria-label="Settings"
                    >
                        <Settings
                            size={18}
                            style={{ color: "#6B7280" }}
                            aria-hidden="true"
                        />
                    </Link>
                ) : null
            }
        >
            <div className="pb-6">
                <div
                    className="h-24 w-full"
                    style={{
                        background:
                            "linear-gradient(135deg, #556B2F 0%, #3E5F44 50%, #F59E0B 100%)",
                    }}
                    aria-hidden="true"
                />

                <div className="px-4 -mt-10">
                    <div className="flex items-end justify-between mb-3">
                        <div className="relative">
                            <Avatar
                                src={profile.photoURL}
                                name={profile.displayName}
                                size={72}
                                className="border-4"
                                style={{ borderColor: "#F8F5EE" }}
                            />
                            {profile.verified && (
                                <div
                                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                                    style={{ background: "#F59E0B" }}
                                >
                                    <BadgeCheck
                                        size={14}
                                        color="white"
                                        aria-hidden="true"
                                    />
                                </div>
                            )}
                        </div>
                        {isOwnProfile ? (
                            <Link
                                href="/settings"
                                className="px-4 py-2 rounded-2xl border font-semibold text-sm"
                                style={{
                                    borderColor: "#D6D3C9",
                                    color: "#1F2937",
                                    background: "#FFFDF8",
                                }}
                            >
                                Edit Profile
                            </Link>
                        ) : (
                            <button
                                className="px-5 py-2 rounded-2xl font-bold text-sm text-white"
                                style={{ background: "#556B2F" }}
                            >
                                Follow
                            </button>
                        )}
                    </div>

                    <div className="mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1
                                className="font-display font-bold text-xl"
                                style={{ color: "#1F2937" }}
                            >
                                {profile.displayName}
                            </h1>
                            {profile.verified && <VerifiedBadge size={16} />}
                        </div>
                        {profile.bio && (
                            <p
                                className="text-sm mt-1.5 leading-relaxed"
                                style={{ color: "#6B7280" }}
                            >
                                {profile.bio}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        <MetaTag
                            icon={MapPin}
                            text={profile.campLocation?.split(" ")[0]}
                            bg="#EDF2E8"
                            color="#556B2F"
                        />
                        <MetaTag
                            icon={Shield}
                            text={
                                profile.platoonNumber
                                    ? `Platoon ${profile.platoonNumber}`
                                    : null
                            }
                            bg="#FEF3C7"
                            color="#92400E"
                        />
                        <MetaTag
                            icon={GraduationCap}
                            text={profile.institutionType}
                            bg="#F3E8FF"
                            color="#6B21A8"
                        />
                        <MetaTag
                            icon={null}
                            text={
                                profile.stateOfOrigin
                                    ? `🇳🇬 ${profile.stateOfOrigin}`
                                    : null
                            }
                            bg="#DBEAFE"
                            color="#1E40AF"
                        />
                    </div>

                    <p className="text-xs mb-4" style={{ color: "#6B7280" }}>
                        Joined {joinDate}
                    </p>

                    <div className="flex gap-2 mb-5">
                        <StatCard
                            icon={FileText}
                            label="Posts"
                            value={profile.postCount}
                            color="#556B2F"
                        />
                        <StatCard
                            icon={Heart}
                            label="Likes"
                            value={profile.likeCount}
                            color="#EF4444"
                        />
                        <StatCard
                            icon={MessageCircle}
                            label="Comments"
                            value={profile.commentCount}
                            color="#3B82F6"
                        />
                        <StatCard
                            icon={BarChart2}
                            label="Votes"
                            value={profile.pollVoteCount}
                            color="#F59E0B"
                        />
                    </div>

                    <div
                        className="flex border-b mb-4"
                        style={{ borderColor: "#D6D3C9" }}
                    >
                        {["posts", "about"].map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className="flex-1 py-2.5 text-sm font-bold capitalize transition-all"
                                style={{
                                    color: tab === t ? "#556B2F" : "#6B7280",
                                    borderBottom:
                                        tab === t
                                            ? "2px solid #556B2F"
                                            : "2px solid transparent",
                                }}
                            >
                                {t === "posts"
                                    ? `Posts (${profile.postCount || 0})`
                                    : "About"}
                            </button>
                        ))}
                    </div>

                    {tab === "posts" && (
                        <div className="flex flex-col gap-3">
                            {posts.length === 0 ? (
                                <div className="text-center py-12">
                                    <div
                                        className="text-4xl mb-2"
                                        aria-hidden="true"
                                    >
                                        📝
                                    </div>
                                    <p
                                        className="text-sm"
                                        style={{ color: "#6B7280" }}
                                    >
                                        No posts yet
                                    </p>
                                    {isOwnProfile && (
                                        <Link
                                            href="/create"
                                            className="mt-3 inline-block px-5 py-2 rounded-2xl font-bold text-sm text-white"
                                            style={{ background: "#556B2F" }}
                                        >
                                            Create your first post
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {posts.map((p) => (
                                        <PostCard
                                            key={p.id}
                                            post={p}
                                            authorProfile={profile}
                                        />
                                    ))}
                                    {hasMore && (
                                        <button
                                            onClick={loadMorePosts}
                                            disabled={loadingPosts}
                                            className="w-full py-3 rounded-2xl border font-semibold text-sm flex items-center justify-center gap-2"
                                            style={{
                                                borderColor: "#D6D3C9",
                                                color: "#6B7280",
                                                background: "#FFFDF8",
                                            }}
                                        >
                                            {loadingPosts ? (
                                                <Loader2
                                                    size={16}
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                "Load more posts"
                                            )}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {tab === "about" && (
                        <div
                            className="rounded-2xl border p-4 flex flex-col gap-3"
                            style={{
                                background: "#FFFDF8",
                                borderColor: "#D6D3C9",
                            }}
                        >
                            {[
                                {
                                    label: "State of Origin",
                                    value: profile.stateOfOrigin,
                                },
                                { label: "Camp", value: profile.campLocation },
                                {
                                    label: "Platoon",
                                    value: profile.platoonNumber
                                        ? `Platoon ${profile.platoonNumber}`
                                        : null,
                                },
                                {
                                    label: "Institution",
                                    value: profile.institutionType,
                                },
                                { label: "Gender", value: profile.gender },
                                { label: "Religion", value: profile.religion },
                            ]
                                .filter((r) => r.value)
                                .map(({ label, value }) => (
                                    <div
                                        key={label}
                                        className="flex items-center justify-between py-2 border-b last:border-0"
                                        style={{ borderColor: "#F3F0E8" }}
                                    >
                                        <span
                                            className="text-xs font-semibold"
                                            style={{ color: "#6B7280" }}
                                        >
                                            {label}
                                        </span>
                                        <span
                                            className="text-sm font-bold"
                                            style={{ color: "#1F2937" }}
                                        >
                                            {value}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
