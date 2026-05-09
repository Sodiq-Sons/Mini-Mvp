"use client";
import { useState, useEffect, useCallback, use, useRef, memo } from "react";
import { formatDistanceToNow } from "date-fns";
import {
    ThumbsUp,
    ThumbsDown,
    Share2,
    MessageCircle,
    BarChart2,
} from "lucide-react";
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

const PollVoting = dynamic(() => import("@/components/polls/PollVoting"), {
    ssr: false,
    loading: () => null,
});
const CommentsSection = dynamic(
    () => import("@/components/comments/CommentsSection"),
    { ssr: false, loading: () => null },
);

// Lazy-load html2canvas once and reuse — avoids re-importing on every share click
let html2canvasPromise = null;
function getHtml2Canvas() {
    if (!html2canvasPromise) {
        html2canvasPromise = import("html2canvas").then((m) => m.default);
    }
    return html2canvasPromise;
}

// ─── Social button (memoised to prevent re-renders) ───────────────────────────
const SocialButton = memo(function SocialButton({ href, bg, label, icon }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 group"
        >
            <div
                className={`w-11 h-11 ${bg} rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm`}
            >
                {icon}
            </div>
            <span className="text-[10px] font-semibold text-gray-500">
                {label}
            </span>
        </a>
    );
});

// ─── Share Modal ──────────────────────────────────────────────────────────────
const ShareModal = memo(function ShareModal({
    isOpen,
    onClose,
    imageDataUrl,
    capturing,
    post,
}) {
    const [linkCopied, setLinkCopied] = useState(false);
    if (!isOpen) return null;

    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareText = `Check out this post: "${post?.title || "this post"}"`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2500);
        } catch {
            toast.error("Could not copy link");
        }
    };

    const handleNativeShare = async () => {
        try {
            if (imageDataUrl && navigator.canShare) {
                const blob = await (await fetch(imageDataUrl)).blob();
                const file = new File([blob], "post.png", {
                    type: "image/png",
                });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: post?.title,
                        text: shareText,
                        url: shareUrl,
                    });
                    return;
                }
            }
            if (navigator.share) {
                await navigator.share({
                    title: post?.title,
                    text: shareText,
                    url: shareUrl,
                });
            }
        } catch {
            // User cancelled or API unavailable — silently ignore
        }
    };

    const handleDownload = () => {
        if (!imageDataUrl) return;
        const a = document.createElement("a");
        a.href = imageDataUrl;
        a.download = `${(post?.title || "post")
            .replace(/\s+/g, "-")
            .toLowerCase()
            .slice(0, 40)}.png`;
        a.click();
    };

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

    const socials = [
        {
            href: twitterUrl,
            bg: "bg-black",
            label: "X",
            icon: (
                <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            ),
        },
        {
            href: whatsappUrl,
            bg: "bg-[#25D366]",
            label: "WhatsApp",
            icon: (
                <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
            ),
        },
        {
            href: telegramUrl,
            bg: "bg-[#229ED9]",
            label: "Telegram",
            icon: (
                <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
            ),
        },
        {
            href: facebookUrl,
            bg: "bg-[#1877F2]",
            label: "Facebook",
            icon: (
                <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm mx-auto z-10 shadow-2xl overflow-hidden">
                {/* drag handle */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 bg-gray-200 rounded-full" />
                </div>

                {/* header */}
                <div className="flex items-center justify-between px-5 pt-3 pb-3">
                    <h3
                        className="text-base font-bold"
                        style={{ color: "#1F2937" }}
                    >
                        Share Post
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                        aria-label="Close share modal"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            className="w-4 h-4"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* preview — clicking routes to post */}
                <div className="px-5 pb-4">
                    <a
                        href={shareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 relative cursor-pointer"
                        style={{ minHeight: "120px" }}
                    >
                        {capturing || !imageDataUrl ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-50">
                                <div
                                    className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                                    style={{
                                        borderColor: "#556B2F",
                                        borderTopColor: "transparent",
                                    }}
                                />
                                <span className="text-xs text-gray-400 font-medium">
                                    Generating preview…
                                </span>
                            </div>
                        ) : (
                            <>
                                <Image
                                    src={imageDataUrl}
                                    alt="Post preview"
                                    width={1200}
                                    height={560}
                                    className="w-full object-cover object-top rounded-2xl"
                                    style={{ maxHeight: "240px" }}
                                />
                                <div
                                    className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-2xl"
                                    style={{ background: "rgba(0,0,0,0.25)" }}
                                >
                                    <span className="text-white text-xs font-bold bg-black/40 px-3 py-1.5 rounded-full">
                                        Tap to open post ↗
                                    </span>
                                </div>
                            </>
                        )}
                    </a>
                </div>

                {/* social icons */}
                <div className="px-5 pb-4 grid grid-cols-5 gap-2">
                    {socials.map((item) => (
                        <SocialButton key={item.label} {...item} />
                    ))}
                    {/* download */}
                    <button
                        onClick={handleDownload}
                        disabled={!imageDataUrl || capturing}
                        className="flex flex-col items-center gap-1.5 group disabled:opacity-40"
                        aria-label="Download post image"
                    >
                        <div className="w-11 h-11 bg-gray-800 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-4 h-4"
                            >
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-semibold text-gray-500">
                            Save
                        </span>
                    </button>
                </div>

                {/* copy link */}
                <div className="px-5 pb-4">
                    <div
                        className="flex items-center gap-2 rounded-2xl border px-3 py-2.5"
                        style={{
                            background: "#F8F5EE",
                            borderColor: "#D6D3C9",
                        }}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            className="w-3.5 h-3.5 text-gray-400 shrink-0"
                        >
                            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                        </svg>
                        <span className="flex-1 text-xs text-gray-400 truncate">
                            {shareUrl}
                        </span>
                        <button
                            onClick={handleCopyLink}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all shrink-0 text-white"
                            style={{
                                background: linkCopied ? "#22c55e" : "#556B2F",
                            }}
                        >
                            {linkCopied ? "Copied!" : "Copy"}
                        </button>
                    </div>
                </div>

                {/* native share — only rendered when API is available */}
                {typeof navigator !== "undefined" && navigator.share && (
                    <div className="px-5 pb-6">
                        <button
                            onClick={handleNativeShare}
                            className="w-full py-3 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-4 h-4"
                            >
                                <circle cx="18" cy="5" r="3" />
                                <circle cx="6" cy="12" r="3" />
                                <circle cx="18" cy="19" r="3" />
                                <line
                                    x1="8.59"
                                    y1="13.51"
                                    x2="15.42"
                                    y2="17.49"
                                />
                                <line
                                    x1="15.41"
                                    y1="6.51"
                                    x2="8.59"
                                    y2="10.49"
                                />
                            </svg>
                            More options
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});

// ─── Stat summary item (memoised — only changes when values change) ───────────
const StatSummaryItem = memo(function StatSummaryItem({
    icon: Icon,
    value,
    label,
    color,
}) {
    return (
        <div
            className="flex flex-col items-center gap-1 flex-1 py-3"
            style={{ borderRight: "0.5px solid #F3F0E8" }}
        >
            <div className="flex items-center gap-1.5">
                <Icon size={14} style={{ color }} aria-hidden="true" />
                <span
                    className="font-bold text-base"
                    style={{ color: "#1F2937" }}
                >
                    {value > 999 ? `${(value / 1000).toFixed(1)}k` : value}
                </span>
            </div>
            <span className="text-[11px]" style={{ color: "#9CA3AF" }}>
                {label}
            </span>
        </div>
    );
});

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PostDetailPage({ params }) {
    const { id } = use(params);
    const { user } = useAuth();
    const postCardRef = useRef(null);

    // Use a ref for the acting flag so handleLike's callback doesn't go stale
    const actingRef = useRef(false);

    const [post, setPost] = useState(null);
    const [author, setAuthor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareImageUrl, setShareImageUrl] = useState(null);
    const [capturing, setCapturing] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const p = await getPostById(id);
                if (cancelled) return;
                if (!p) {
                    setLoading(false);
                    return;
                }
                setPost(p);
                setLoading(false);
                if (p.authorId) {
                    getUserById(p.authorId).then((a) => {
                        if (!cancelled) setAuthor(a);
                    });
                }
            } catch {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        // Subscribe for real-time updates; always unsubscribe on cleanup
        const unsub = subscribeToPost(id, (updated) => {
            if (!cancelled) setPost(updated);
        });

        return () => {
            cancelled = true;
            unsub?.();
        };
    }, [id]);

    const isLiked = user && post?.likedBy?.includes(user.uid);
    const isDisliked = user && post?.dislikedBy?.includes(user.uid);

    // actingRef avoids stale-closure issues without adding it to the dep array
    const handleLike = useCallback(
        async (action) => {
            if (!user) return toast.error("Sign in first");
            if (actingRef.current) return;
            actingRef.current = true;
            try {
                await likePost(id, user.uid, action);
            } finally {
                actingRef.current = false;
            }
        },
        [user, id],
    );

    const captureAndShare = useCallback(async () => {
        setShowShareModal(true);
        setShareImageUrl(null);
        setCapturing(true);
        try {
            if (!postCardRef.current) throw new Error("No ref");
            const html2canvas = await getHtml2Canvas();
            const canvas = await html2canvas(postCardRef.current, {
                useCORS: true,
                allowTaint: true,
                scale: 2,
                backgroundColor: "#FFFDF8",
                logging: false,
                ignoreElements: (el) => el.hasAttribute("data-share-ignore"),
            });
            setShareImageUrl(canvas.toDataURL("image/png"));
        } catch (err) {
            console.error("Capture failed:", err);
            toast.error("Could not generate preview");
        } finally {
            setCapturing(false);
        }
    }, []);

    const handleCloseShare = useCallback(() => {
        setShowShareModal(false);
        setShareImageUrl(null);
    }, []);

    let time = "recently";
    if (post?.createdAt?.toDate) {
        try {
            time = formatDistanceToNow(post.createdAt.toDate(), {
                addSuffix: true,
            });
        } catch {
            // keep default
        }
    }

    if (loading) {
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
    }

    if (!post) {
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
    }

    const authorName = author?.displayName || post.authorName;
    const authorPhoto = author?.photoURL || post.authorPhotoURL;
    const totalLikes = post.likeCount || 0;
    const totalDislikes = post.dislikeCount || 0;
    const totalComments = post.commentCount || 0;
    const totalVotes = post.pollTotalVotes || 0;

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

                {/* ── Captured card ─────────────────────────────────────── */}
                <div
                    ref={postCardRef}
                    className="rounded-2xl border p-4"
                    style={{ background: "#FFFDF8", borderColor: "#D6D3C9" }}
                >
                    {/* author row */}
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

                    {/* title + body */}
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

                    {/* stats summary — included in screenshot */}
                    <div
                        className="flex rounded-xl overflow-hidden mt-4"
                        style={{
                            background: "#F8F5EE",
                            border: "0.5px solid #D6D3C9",
                        }}
                    >
                        <StatSummaryItem
                            icon={ThumbsUp}
                            value={totalLikes}
                            label="Likes"
                            color="#556B2F"
                        />
                        <StatSummaryItem
                            icon={ThumbsDown}
                            value={totalDislikes}
                            label="Dislikes"
                            color="#EF4444"
                        />
                        <StatSummaryItem
                            icon={MessageCircle}
                            value={totalComments}
                            label="Comments"
                            color="#3266ad"
                        />
                        {post.hasPoll && (
                            <StatSummaryItem
                                icon={BarChart2}
                                value={totalVotes}
                                label="Votes"
                                color="#d95f02"
                            />
                        )}
                    </div>

                    {/* action buttons — excluded from screenshot */}
                    <div
                        data-share-ignore
                        className="flex items-center gap-2 mt-3 pt-3 border-t"
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
                            aria-pressed={!!isLiked}
                            aria-label="Like"
                        >
                            <ThumbsUp
                                size={16}
                                strokeWidth={isLiked ? 2.5 : 1.8}
                                aria-hidden="true"
                            />
                            {isLiked ? "Liked" : "Like"}
                        </button>
                        <button
                            onClick={() =>
                                handleLike(isDisliked ? "undislike" : "dislike")
                            }
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                            style={{
                                background: isDisliked ? "#FEE2E2" : "#F3F0E8",
                                color: isDisliked ? "#EF4444" : "#6B7280",
                                border: isDisliked
                                    ? "1px solid #EF4444"
                                    : "1px solid transparent",
                            }}
                            aria-pressed={!!isDisliked}
                            aria-label="Dislike"
                        >
                            <ThumbsDown
                                size={16}
                                strokeWidth={isDisliked ? 2.5 : 1.8}
                                aria-hidden="true"
                            />
                            {isDisliked ? "Disliked" : "Dislike"}
                        </button>
                        <button
                            onClick={captureAndShare}
                            className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                            style={{
                                background: "#F3F0E8",
                                color: "#6B7280",
                                border: "1px solid #D6D3C9",
                            }}
                            aria-label="Share post"
                        >
                            <Share2 size={16} aria-hidden="true" />
                            Share
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

            <ShareModal
                isOpen={showShareModal}
                onClose={handleCloseShare}
                imageDataUrl={shareImageUrl}
                capturing={capturing}
                post={post}
            />
        </AppShell>
    );
}
