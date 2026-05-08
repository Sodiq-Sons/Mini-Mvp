"use client";
import { useState, useCallback, memo } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
    ThumbsUp,
    ThumbsDown,
    MessageCircle,
    BarChart2,
    Share2,
} from "lucide-react";
import Avatar from "@/components/shared/Avatar";
import VerifiedBadge from "@/components/shared/VerifiedBadge";
import CategoryPill from "@/components/shared/CategoryPill";
import { likePost } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import Image from "next/image";

function StatBtn({ icon: Icon, count, active, activeColor, onClick, label }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold stat-btn"
            data-active={active}
            data-color={activeColor}
            style={
                active
                    ? {
                          background: `${activeColor}18`,
                          color: activeColor,
                          border: `1px solid ${activeColor}30`,
                      }
                    : undefined
            }
            aria-label={label}
        >
            <Icon size={14} strokeWidth={active ? 2.5 : 1.8} />
            <span>{count > 999 ? `${(count / 1000).toFixed(1)}k` : count}</span>
        </button>
    );
}

// Stable date formatter — avoids re-computation on every render
function useFormattedTime(createdAt) {
    const date = createdAt?.toDate ? createdAt.toDate() : new Date();
    return formatDistanceToNow(date, { addSuffix: true });
}

const PostCard = memo(function PostCard({ post, authorProfile }) {
    const { user } = useAuth();
    const [likeCount, setLikeCount] = useState(post.likeCount || 0);
    const [dislikeCount, setDislikeCount] = useState(post.dislikeCount || 0);
    const [likedBy, setLikedBy] = useState(post.likedBy || []);
    const [dislikedBy, setDislikedBy] = useState(post.dislikedBy || []);
    const [acting, setActing] = useState(false);

    const isLiked = user && likedBy.includes(user.uid);
    const isDisliked = user && dislikedBy.includes(user.uid);
    const timeAgo = useFormattedTime(post.createdAt);

    const handleLike = useCallback(
        async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!user) return toast.error("Sign in to like posts");
            if (acting) return;
            setActing(true);
            try {
                if (isLiked) {
                    setLikeCount((c) => c - 1);
                    setLikedBy((b) => b.filter((id) => id !== user.uid));
                    await likePost(post.id, user.uid, "unlike");
                } else {
                    setLikeCount((c) => c + 1);
                    setLikedBy((b) => [...b, user.uid]);
                    if (isDisliked) {
                        setDislikeCount((c) => c - 1);
                        setDislikedBy((b) => b.filter((id) => id !== user.uid));
                    }
                    await likePost(post.id, user.uid, "like");
                }
            } finally {
                setActing(false);
            }
        },
        [user, isLiked, isDisliked, acting, post.id],
    );

    const handleDislike = useCallback(
        async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!user) return toast.error("Sign in to interact");
            if (acting) return;
            setActing(true);
            try {
                if (isDisliked) {
                    setDislikeCount((c) => c - 1);
                    setDislikedBy((b) => b.filter((id) => id !== user.uid));
                    await likePost(post.id, user.uid, "undislike");
                } else {
                    setDislikeCount((c) => c + 1);
                    setDislikedBy((b) => [...b, user.uid]);
                    if (isLiked) {
                        setLikeCount((c) => c - 1);
                        setLikedBy((b) => b.filter((id) => id !== user.uid));
                    }
                    await likePost(post.id, user.uid, "dislike");
                }
            } finally {
                setActing(false);
            }
        },
        [user, isLiked, isDisliked, acting, post.id],
    );

    const handleShare = useCallback(
        async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const url = `${window.location.origin}/post/${post.id}`;
            try {
                if (navigator.share) {
                    await navigator.share({
                        title: post.title,
                        text: post.description?.slice(0, 100),
                        url,
                    });
                } else {
                    await navigator.clipboard.writeText(url);
                    toast.success("Link copied!");
                }
            } catch {}
        },
        [post.id, post.title, post.description],
    );

    const name =
        authorProfile?.displayName || post.authorName || "Corps Member";
    const avatar = authorProfile?.photoURL || post.authorPhotoURL;
    const verified = authorProfile?.verified || post.authorVerified;
    const platoon = authorProfile?.platoonNumber || post.authorPlatoon;

    return (
        <Link href={`/post/${post.id}`} className="block">
            <article
                className="rounded-2xl border post-card cursor-pointer"
                style={{ background: "#FFFDF8", borderColor: "#D6D3C9" }}
            >
                {post.imageURL && (
                    <div className="h-48 rounded-t-2xl overflow-hidden relative">
                        <Image
                            src={post.imageURL}
                            alt={post.title}
                            fill
                            sizes="(max-width: 672px) 100vw, 672px"
                            className="object-cover"
                            loading="lazy"
                            decoding="async"
                        />
                    </div>
                )}
                <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <Link
                            href={`/profile/${post.authorId}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Avatar src={avatar} name={name} size={38} />
                        </Link>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <Link
                                    href={`/profile/${post.authorId}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-sm font-bold truncate"
                                    style={{ color: "#1F2937" }}
                                >
                                    {name}
                                </Link>
                                {verified && <VerifiedBadge size={14} />}
                                {platoon && (
                                    <span
                                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{
                                            background: "#EDF2E8",
                                            color: "#556B2F",
                                        }}
                                    >
                                        Platoon {platoon}
                                    </span>
                                )}
                            </div>
                            <div
                                className="text-xs"
                                style={{ color: "#6B7280" }}
                            >
                                {timeAgo}
                            </div>
                        </div>
                        <CategoryPill category={post.category} size="xs" />
                    </div>

                    <h3
                        className="font-display font-bold text-base mb-1.5 leading-snug"
                        style={{ color: "#1F2937" }}
                    >
                        {post.title}
                    </h3>
                    {post.description && (
                        <p
                            className="text-sm leading-relaxed line-clamp-2"
                            style={{ color: "#6B7280" }}
                        >
                            {post.description}
                        </p>
                    )}

                    {post.hasPoll && post.pollPreview && (
                        <div
                            className="mt-3 p-3 rounded-xl"
                            style={{
                                background: "#EDF2E8",
                                border: "1px solid #C8D8B8",
                            }}
                        >
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <BarChart2
                                    size={13}
                                    style={{ color: "#556B2F" }}
                                />
                                <span
                                    className="text-xs font-bold"
                                    style={{ color: "#556B2F" }}
                                >
                                    Poll
                                </span>
                            </div>
                            <p
                                className="text-xs font-semibold"
                                style={{ color: "#1F2937" }}
                            >
                                {post.pollPreview}
                            </p>
                            <p
                                className="text-xs mt-1"
                                style={{ color: "#6B7280" }}
                            >
                                {post.pollTotalVotes || 0} votes
                            </p>
                        </div>
                    )}

                    <div className="flex items-center gap-2 mt-4">
                        <StatBtn
                            icon={ThumbsUp}
                            count={likeCount}
                            active={isLiked}
                            activeColor="#556B2F"
                            onClick={handleLike}
                            label="Like"
                        />
                        <StatBtn
                            icon={ThumbsDown}
                            count={dislikeCount}
                            active={isDisliked}
                            activeColor="#EF4444"
                            onClick={handleDislike}
                            label="Dislike"
                        />
                        <StatBtn
                            icon={MessageCircle}
                            count={post.commentCount || 0}
                            active={false}
                            activeColor="#556B2F"
                            onClick={(e) => e.preventDefault()}
                            label="Comments"
                        />
                        <div className="ml-auto">
                            <button
                                onClick={handleShare}
                                className="p-2 rounded-xl"
                                style={{ background: "#F3F0E8" }}
                            >
                                <Share2
                                    size={14}
                                    style={{ color: "#6B7280" }}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
});

export default PostCard;
