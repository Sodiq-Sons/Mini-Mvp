"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    startAfter,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import PostCard from "@/components/feed/PostCard";
import FeedFilter from "@/components/feed/FeedFilter";
import SkeletonLoader from "@/components/shared/SkeletonLoader";
import { getPosts, getUserById } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { Loader2, RefreshCw } from "lucide-react";

export default function FeedPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [filter, setFilter] = useState("latest");
    const [posts, setPosts] = useState([]);
    const [authorMap, setAuthorMap] = useState({});
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const sentinelRef = useRef(null);
    const observerRef = useRef(null);
    const redirectedRef = useRef(false);
    const activeFilterRef = useRef(filter);

    // ── Redirect ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (authLoading || redirectedRef.current) return;
        if (!user) {
            redirectedRef.current = true;
            router.replace("/auth/login");
        } else if (user && profile && !profile.onboardingComplete) {
            redirectedRef.current = true;
            router.replace("/auth/onboarding");
        }
    }, [user, profile, authLoading, router]);

    // ── Helper: batch-fetch authors not already in map ────────────────────────
    const fetchAuthors = useCallback(async (newPosts, existingMap = {}) => {
        const uids = [
            ...new Set(newPosts.map((p) => p.authorId).filter(Boolean)),
        ].filter((id) => !existingMap[id]);
        if (uids.length === 0) return existingMap;
        const profiles = await Promise.all(uids.map((uid) => getUserById(uid)));
        const map = { ...existingMap };
        profiles.forEach((p) => {
            if (p) map[p.id] = p;
        });
        return map;
    }, []);

    // ── Initial / filter-change fetch — defined inside effect to avoid cascade ─
    useEffect(() => {
        if (!user) return;

        let cancelled = false;
        activeFilterRef.current = filter;

        async function load() {
            setLoading(true);
            setPosts([]);
            setLastDoc(null);
            setHasMore(true);
            try {
                const q = query(
                    collection(db, "posts"),
                    orderBy("createdAt", "desc"),
                    limit(10),
                );
                const snap = await getDocs(q);
                if (cancelled) return;
                const newPosts = snap.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                }));
                const map = await fetchAuthors(newPosts);
                if (cancelled) return;
                setPosts(newPosts);
                setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
                setHasMore(snap.docs.length === 10);
                setAuthorMap(map);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [filter, user, fetchAuthors]);

    // ── Load more (pagination) ────────────────────────────────────────────────
    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore || !lastDoc) return;
        setLoadingMore(true);
        try {
            const {
                posts: more,
                lastDoc: last,
                hasMore: moreExists,
            } = await getPosts(activeFilterRef.current, lastDoc, 10);
            const newMap = await fetchAuthors(more, authorMap);
            setPosts((prev) => {
                const ids = new Set(prev.map((p) => p.id));
                return [...prev, ...more.filter((p) => !ids.has(p.id))];
            });
            setLastDoc(last);
            setHasMore(moreExists);
            setAuthorMap(newMap);
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, hasMore, lastDoc, authorMap, fetchAuthors]);

    // ── Intersection observer ─────────────────────────────────────────────────
    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect();
        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) loadMore();
            },
            { rootMargin: "300px" },
        );
        if (sentinelRef.current)
            observerRef.current.observe(sentinelRef.current);
        return () => observerRef.current?.disconnect();
    }, [loadMore]);

    // ── Refresh handler (passed to button) ───────────────────────────────────
    const handleRefresh = useCallback(() => {
        // toggling a ref-based counter or just re-setting filter triggers the effect
        setFilter((f) => f); // same value — won't re-run; use a refresh token instead
    }, []);

    // Use a refresh token so the "Refresh feed" button works
    const [refreshToken, setRefreshToken] = useState(0);

    useEffect(() => {
        if (!user || refreshToken === 0) return;
        let cancelled = false;

        async function load() {
            setLoading(true);
            setPosts([]);
            setLastDoc(null);
            setHasMore(true);
            try {
                const q = query(
                    collection(db, "posts"),
                    orderBy("createdAt", "desc"),
                    limit(10),
                );
                const snap = await getDocs(q);
                if (cancelled) return;
                const newPosts = snap.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                }));
                const map = await fetchAuthors(newPosts);
                if (cancelled) return;
                setPosts(newPosts);
                setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
                setHasMore(snap.docs.length === 10);
                setAuthorMap(map);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [refreshToken, user, fetchAuthors]);

    if (authLoading || !user) return null;

    return (
        <AppShell showSearch>
            {profile && (
                <div className="px-4 pt-4 pb-2">
                    <div
                        className="rounded-2xl p-4"
                        style={{
                            background:
                                "linear-gradient(135deg, #556B2F, #3E5F44)",
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-white/70">
                                    Good day, corper! 👋
                                </p>
                                <h2 className="font-display font-bold text-lg text-white mt-0.5">
                                    {profile.displayName?.split(" ")[0] ||
                                        "Corps Member"}
                                </h2>
                                {profile.platoonNumber && (
                                    <p className="text-xs text-white/70 mt-0.5">
                                        Platoon {profile.platoonNumber} ·{" "}
                                        {profile.campLocation?.split(" ")[0]}
                                    </p>
                                )}
                            </div>
                            <div className="text-4xl" aria-hidden="true">
                                ⛺
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <FeedFilter active={filter} onChange={setFilter} />

            <div className="px-4 pb-4 flex flex-col gap-3 mt-4">
                {loading ? (
                    <SkeletonLoader count={4} />
                ) : posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="text-5xl mb-4" aria-hidden="true">
                            🏕️
                        </div>
                        <h3
                            className="font-display font-bold text-lg"
                            style={{ color: "#1F2937" }}
                        >
                            No posts yet
                        </h3>
                        <p
                            className="text-sm mt-1"
                            style={{ color: "#6B7280" }}
                        >
                            Be the first to share something!
                        </p>
                        <button
                            onClick={() => router.push("/create")}
                            className="mt-4 px-6 py-2.5 rounded-2xl font-bold text-sm text-white"
                            style={{ background: "#556B2F" }}
                        >
                            Create Post
                        </button>
                    </div>
                ) : (
                    <>
                        {posts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                authorProfile={authorMap[post.authorId]}
                            />
                        ))}
                        <div ref={sentinelRef} aria-hidden="true" />
                        {loadingMore && (
                            <div className="flex justify-center py-4">
                                <Loader2
                                    size={24}
                                    className="animate-spin"
                                    style={{ color: "#556B2F" }}
                                />
                            </div>
                        )}
                        {!hasMore && posts.length > 0 && (
                            <div className="text-center py-4">
                                <p
                                    className="text-xs"
                                    style={{ color: "#6B7280" }}
                                >
                                    You&apos;ve seen it all! 🎉
                                </p>
                                <button
                                    onClick={() =>
                                        setRefreshToken((t) => t + 1)
                                    }
                                    className="mt-2 flex items-center gap-1 text-xs font-semibold mx-auto"
                                    style={{ color: "#556B2F" }}
                                >
                                    <RefreshCw size={12} aria-hidden="true" />{" "}
                                    Refresh feed
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppShell>
    );
}
