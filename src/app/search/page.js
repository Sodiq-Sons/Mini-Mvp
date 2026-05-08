"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import {
    collection,
    query,
    orderBy,
    limit,
    where,
    getDocs,
    startAt,
    endAt,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import AppShell from "@/components/layout/AppShell";
import PostCard from "@/components/feed/PostCard";
import Avatar from "@/components/shared/Avatar";
import VerifiedBadge from "@/components/shared/VerifiedBadge";
import { useAuth } from "@/context/AuthContext";

function useDebounce(value, delay) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

async function searchFirestore(term) {
    if (!term || term.length < 2) return { posts: [], users: [] };
    const end = term + "\uf8ff";

    const [postsSnap, usersSnap] = await Promise.all([
        getDocs(
            query(
                collection(db, "posts"),
                orderBy("title"),
                startAt(term),
                endAt(end),
                limit(10),
            ),
        ),
        getDocs(
            query(
                collection(db, "users"),
                orderBy("displayName"),
                startAt(term),
                endAt(end),
                limit(6),
            ),
        ),
    ]);

    return {
        posts: postsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        users: usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    };
}

const SUGGESTIONS = [
    "🍛 Camp food review",
    "🏕️ Orientation day",
    "⚠️ Camp issues",
    "🎉 Passing out parade",
    "😂 Camp stories",
    "🎶 Mammy market",
];

export default function SearchPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [query_, setQuery] = useState("");
    const [results, setResults] = useState({ posts: [], users: [] });
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [tab, setTab] = useState("all");
    const debouncedQuery = useDebounce(query_, 500);

    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults({ posts: [], users: [] });
            setSearched(false);
            return;
        }
        const run = async () => {
            setLoading(true);
            const res = await searchFirestore(debouncedQuery.trim());
            setResults(res);
            setSearched(true);
            setLoading(false);
        };
        run();
    }, [debouncedQuery]);

    const total = results.posts.length + results.users.length;

    return (
        <div className="min-h-screen" style={{ background: "#F8F5EE" }}>
            {/* Header */}
            <header
                className="sticky top-0 z-40 border-b px-4 pt-3 pb-3"
                style={{
                    background: "rgba(255,253,248,0.94)",
                    backdropFilter: "blur(12px)",
                    borderColor: "#D6D3C9",
                }}
            >
                <div className="max-w-2xl mx-auto flex items-center gap-2">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-xl flex-shrink-0"
                    >
                        <ArrowLeft size={20} style={{ color: "#1F2937" }} />
                    </button>
                    <div
                        className="flex-1 flex items-center gap-2 rounded-2xl border px-3 py-2.5"
                        style={{
                            background: "#FFFDF8",
                            borderColor: query_ ? "#556B2F" : "#D6D3C9",
                        }}
                    >
                        <Search size={16} style={{ color: "#6B7280" }} />
                        <input
                            autoFocus
                            value={query_}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search posts, users, camps..."
                            className="flex-1 text-sm outline-none bg-transparent"
                            style={{
                                color: "#1F2937",
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                            }}
                        />
                        {query_ && (
                            <button onClick={() => setQuery("")}>
                                <X size={14} style={{ color: "#6B7280" }} />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-4">
                {/* Suggestions when empty */}
                {!query_ && (
                    <div>
                        <h3
                            className="text-xs font-bold mb-3 uppercase tracking-wider"
                            style={{ color: "#6B7280" }}
                        >
                            Try searching for
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {SUGGESTIONS.map((s) => (
                                <button
                                    key={s}
                                    onClick={() =>
                                        setQuery(s.replace(/^[^\s]+ /, ""))
                                    }
                                    className="px-4 py-2 rounded-2xl border text-sm font-medium transition-all"
                                    style={{
                                        background: "#FFFDF8",
                                        borderColor: "#D6D3C9",
                                        color: "#6B7280",
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <Loader2
                            size={24}
                            className="animate-spin"
                            style={{ color: "#556B2F" }}
                        />
                    </div>
                )}

                {/* No results */}
                {searched && !loading && total === 0 && (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-3">🔍</div>
                        <h3
                            className="font-bold text-base"
                            style={{ color: "#1F2937" }}
                        >
                            No results for &quot;{query_}&quot;
                        </h3>
                        <p
                            className="text-sm mt-1"
                            style={{ color: "#6B7280" }}
                        >
                            Try different keywords
                        </p>
                    </div>
                )}

                {/* Results */}
                {searched && !loading && total > 0 && (
                    <div>
                        {/* Tab filter */}
                        <div
                            className="flex gap-1 p-1 rounded-2xl mb-4"
                            style={{
                                background: "#FFFDF8",
                                border: "1px solid #D6D3C9",
                            }}
                        >
                            {[
                                { key: "all", label: `All (${total})` },
                                {
                                    key: "posts",
                                    label: `Posts (${results.posts.length})`,
                                },
                                {
                                    key: "users",
                                    label: `Users (${results.users.length})`,
                                },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setTab(key)}
                                    className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                                    style={{
                                        background:
                                            tab === key
                                                ? "#556B2F"
                                                : "transparent",
                                        color:
                                            tab === key ? "white" : "#6B7280",
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Users */}
                        {(tab === "all" || tab === "users") &&
                            results.users.length > 0 && (
                                <div className="mb-4">
                                    {tab === "all" && (
                                        <h4
                                            className="text-xs font-bold mb-2 uppercase tracking-wider"
                                            style={{ color: "#6B7280" }}
                                        >
                                            Users
                                        </h4>
                                    )}
                                    <div className="flex flex-col gap-2">
                                        {results.users.map((u) => (
                                            <Link
                                                key={u.id}
                                                href={`/profile/${u.id}`}
                                            >
                                                <div
                                                    className="flex items-center gap-3 p-3 rounded-2xl border"
                                                    style={{
                                                        background: "#FFFDF8",
                                                        borderColor: "#D6D3C9",
                                                    }}
                                                >
                                                    <Avatar
                                                        src={u.photoURL}
                                                        name={u.displayName}
                                                        size={44}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1">
                                                            <span
                                                                className="font-bold text-sm"
                                                                style={{
                                                                    color: "#1F2937",
                                                                }}
                                                            >
                                                                {u.displayName}
                                                            </span>
                                                            {u.verified && (
                                                                <VerifiedBadge
                                                                    size={13}
                                                                />
                                                            )}
                                                        </div>
                                                        <p
                                                            className="text-xs truncate"
                                                            style={{
                                                                color: "#6B7280",
                                                            }}
                                                        >
                                                            {u.campLocation}{" "}
                                                            {u.platoonNumber
                                                                ? `· Platoon ${u.platoonNumber}`
                                                                : ""}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                        {/* Posts */}
                        {(tab === "all" || tab === "posts") &&
                            results.posts.length > 0 && (
                                <div>
                                    {tab === "all" && (
                                        <h4
                                            className="text-xs font-bold mb-2 uppercase tracking-wider"
                                            style={{ color: "#6B7280" }}
                                        >
                                            Posts
                                        </h4>
                                    )}
                                    <div className="flex flex-col gap-2.5">
                                        {results.posts.map((p) => (
                                            <PostCard key={p.id} post={p} />
                                        ))}
                                    </div>
                                </div>
                            )}
                    </div>
                )}
            </div>
        </div>
    );
}
