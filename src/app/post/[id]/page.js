"use client";
import { useState, useEffect, useCallback, use } from "react";
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp, ThumbsDown, Share2, MessageCircle } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import Avatar from "@/components/shared/Avatar";
import VerifiedBadge from "@/components/shared/VerifiedBadge";
import CategoryPill from "@/components/shared/CategoryPill";
import {
    getPostById,
    getUserById,
    likePost,
    subscribeToPost,
} from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import Image from "next/image";
import dynamic from "next/dynamic";

// Lazy-load heavy components — they're below the fold and not needed for initial paint
const PollVoting = dynamic(() => import("@/components/polls/PollVoting"), {
    ssr: false,
    loading: () => null,
});
const CommentsSection = dynamic(
    () => import("@/components/comments/CommentsSection"),
    { ssr: false, loading: () => null },
);

export default function PostDetailPage({ params }) {
    const { id } = use(params);
    const { user } = useAuth();
    const [post, setPost] = useState(null);
    const [author, setAuthor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            const p = await getPostById(id);
            if (cancelled) return;
            if (!p) {
                setLoading(false);
                return;
            }
            setPost(p);
            setLoading(false);
            // Load author after paint — non-blocking
            if (p.authorId) {
                getUserById(p.authorId).then((a) => {
                    if (!cancelled) setAuthor(a);
                });
            }
        };
        load();

        const unsub = subscribeToPost(id, (updated) => {
            if (!cancelled) setPost(updated);
        });
        return () => {
            cancelled = true;
            unsub();
        };
    }, [id]);

    const isLiked = user && post?.likedBy?.includes(user.uid);
    const isDisliked = user && post?.dislikedBy?.includes(user.uid);

    const handleLike = useCallback(
        async (action) => {
            if (!user) return toast.error("Sign in first");
            if (acting) return;
            setActing(true);
            try {
                await likePost(id, user.uid, action);
            } finally {
                setActing(false);
            }
        },
        [user, acting, id],
    );

    const postTitle = post?.title;

    const handleShare = useCallback(async () => {
        try {
            if (navigator.share)
                await navigator.share({
                    title: postTitle,
                    url: window.location.href,
                });
            else {
                await navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied!");
            }
        } catch {}
    }, [postTitle]);

    const time = post?.createdAt?.toDate
        ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true })
        : "recently";

    if (loading)
        return (
            <AppShell title="Post" showBack>
                <div className="flex justify-center py-16">
                    <div
                        className="w-8 h-8 border-[3px] border-t-transparent rounded-full animate-spin"
                        style={{
                            borderColor: "#556B2F",
                            borderTopColor: "transparent",
                        }}
                        aria-label="Loading"
                    />
                </div>
            </AppShell>
        );

    if (!post)
        return (
            <AppShell title="Post" showBack>
                <div className="text-center py-16">
                    <div className="text-4xl mb-2" aria-hidden="true">
                        🔍
                    </div>
                    <p style={{ color: "#6B7280" }}>Post not found</p>
                </div>
            </AppShell>
        );

    const authorName = author?.displayName || post.authorName;
    const authorPhoto = author?.photoURL || post.authorPhotoURL;

    return (
        <AppShell showBack backHref="/">
            <div className="px-4 py-4 flex flex-col gap-4">
                {post.imageURL && (
                    <div className="rounded-2xl overflow-hidden">
                        <Image
                            src={post.imageURL}
                            alt={post.title}
                            width={672}
                            height={336}
                            priority
                            className="w-full max-h-72 object-cover"
                            sizes="(max-width: 672px) 100vw, 672px"
                        />
                    </div>
                )}

                <div
                    className="rounded-2xl border p-4"
                    style={{ background: "#FFFDF8", borderColor: "#D6D3C9" }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Avatar src={authorPhoto} name={authorName} size={44} />
                        <div className="flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                    className="font-bold"
                                    style={{ color: "#1F2937" }}
                                >
                                    {authorName}
                                </span>
                                {(author?.verified || post.authorVerified) && (
                                    <VerifiedBadge />
                                )}
                                {(author?.platoonNumber ||
                                    post.authorPlatoon) && (
                                    <span
                                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{
                                            background: "#EDF2E8",
                                            color: "#556B2F",
                                        }}
                                    >
                                        Platoon{" "}
                                        {author?.platoonNumber ||
                                            post.authorPlatoon}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span
                                    className="text-xs"
                                    style={{ color: "#6B7280" }}
                                >
                                    {time}
                                </span>
                                <CategoryPill
                                    category={post.category}
                                    size="xs"
                                />
                            </div>
                        </div>
                    </div>

                    <h1
                        className="font-display font-bold text-xl leading-snug mb-3"
                        style={{ color: "#1F2937" }}
                    >
                        {post.title}
                    </h1>
                    {post.description && (
                        <p
                            className="text-sm leading-relaxed"
                            style={{ color: "#374151" }}
                        >
                            {post.description}
                        </p>
                    )}

                    <div
                        className="flex items-center gap-2 mt-4 pt-4 border-t"
                        style={{ borderColor: "#F3F0E8" }}
                    >
                        <button
                            onClick={() =>
                                handleLike(isLiked ? "unlike" : "like")
                            }
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                            style={{
                                background: isLiked ? "#EDF2E8" : "#F3F0E8",
                                color: isLiked ? "#556B2F" : "#6B7280",
                                border: isLiked
                                    ? "1px solid #556B2F"
                                    : "1px solid transparent",
                            }}
                            aria-pressed={isLiked}
                            aria-label="Like"
                        >
                            <ThumbsUp
                                size={16}
                                strokeWidth={isLiked ? 2.5 : 1.8}
                                aria-hidden="true"
                            />
                            {post.likeCount || 0}
                        </button>
                        <button
                            onClick={() =>
                                handleLike(isDisliked ? "undislike" : "dislike")
                            }
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                            style={{
                                background: isDisliked ? "#FEE2E2" : "#F3F0E8",
                                color: isDisliked ? "#EF4444" : "#6B7280",
                            }}
                            aria-pressed={isDisliked}
                            aria-label="Dislike"
                        >
                            <ThumbsDown
                                size={16}
                                strokeWidth={isDisliked ? 2.5 : 1.8}
                                aria-hidden="true"
                            />
                            {post.dislikeCount || 0}
                        </button>
                        <div
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm"
                            style={{ background: "#F3F0E8", color: "#6B7280" }}
                        >
                            <MessageCircle size={16} aria-hidden="true" />
                            {post.commentCount || 0}
                        </div>
                        <button
                            onClick={handleShare}
                            className="ml-auto p-2 rounded-xl"
                            style={{ background: "#F3F0E8" }}
                            aria-label="Share post"
                        >
                            <Share2
                                size={16}
                                style={{ color: "#6B7280" }}
                                aria-hidden="true"
                            />
                        </button>
                    </div>
                </div>

                {post.hasPoll && post.pollId && (
                    <PollVoting postId={id} pollId={post.pollId} />
                )}

                <div
                    className="rounded-2xl border p-4"
                    style={{ background: "#FFFDF8", borderColor: "#D6D3C9" }}
                >
                    <CommentsSection postId={id} />
                </div>
            </div>
        </AppShell>
    );
}
