"use client";
import { useState, useEffect, useCallback, memo } from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, Send, Loader2 } from "lucide-react";
import Avatar from "@/components/shared/Avatar";
import VerifiedBadge from "@/components/shared/VerifiedBadge";
import {
    addComment,
    subscribeToComments,
    likeComment,
    getUserById,
} from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

const CommentItem = memo(function CommentItem({ comment, postId, authorMap }) {
    const { user } = useAuth();
    const [liked, setLiked] = useState(
        () => comment.likedBy?.includes(user?.uid) ?? false,
    );
    const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
    const author = authorMap[comment.authorId] || {};

    const time = comment.createdAt?.toDate
        ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true })
        : "just now";

    const handleLike = useCallback(async () => {
        if (!user) return toast.error("Sign in to like");
        setLiked((l) => !l);
        setLikeCount((c) => c + (liked ? -1 : 1));
        await likeComment(postId, comment.id, user.uid);
    }, [user, liked, postId, comment.id]);

    return (
        <div className="flex gap-3">
            <Avatar
                src={author.photoURL || comment.authorPhotoURL}
                name={author.displayName || comment.authorName}
                size={32}
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                        className="text-sm font-bold"
                        style={{ color: "#1F2937" }}
                    >
                        {author.displayName ||
                            comment.authorName ||
                            "Corps Member"}
                    </span>
                    {(author.verified || comment.authorVerified) && (
                        <VerifiedBadge size={13} />
                    )}
                    {author.platoonNumber && (
                        <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: "#EDF2E8", color: "#556B2F" }}
                        >
                            P{author.platoonNumber}
                        </span>
                    )}
                    <span className="text-xs" style={{ color: "#6B7280" }}>
                        {time}
                    </span>
                </div>
                <p
                    className="text-sm mt-1 leading-relaxed"
                    style={{ color: "#374151" }}
                >
                    {comment.text}
                </p>
                <button
                    onClick={handleLike}
                    className="flex items-center gap-1 text-xs font-semibold mt-2"
                >
                    <Heart
                        size={13}
                        fill={liked ? "#EF4444" : "none"}
                        style={{ color: liked ? "#EF4444" : "#6B7280" }}
                    />
                    {likeCount > 0 && (
                        <span style={{ color: liked ? "#EF4444" : "#6B7280" }}>
                            {likeCount}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
});

export default function CommentsSection({ postId }) {
    const { user, profile } = useAuth();
    const [comments, setComments] = useState([]);
    const [authorMap, setAuthorMap] = useState({});
    const [text, setText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = subscribeToComments(postId, async (rawComments) => {
            const sorted = [...rawComments].sort((a, b) => {
                if (a.authorVerified && !b.authorVerified) return -1;
                if (!a.authorVerified && b.authorVerified) return 1;
                return (
                    (a.createdAt?.toMillis?.() || 0) -
                    (b.createdAt?.toMillis?.() || 0)
                );
            });
            setComments(sorted);
            setLoading(false);

            // Only fetch authors not already in map
            setAuthorMap((prev) => {
                const newUids = [
                    ...new Set(sorted.map((c) => c.authorId).filter(Boolean)),
                ].filter((id) => !prev[id]);
                if (newUids.length === 0) return prev;
                Promise.all(newUids.map((uid) => getUserById(uid))).then(
                    (profiles) => {
                        const map = { ...prev };
                        profiles.forEach((p) => {
                            if (p) map[p.id] = p;
                        });
                        setAuthorMap(map);
                    },
                );
                return prev;
            });
        });
        return unsub;
    }, [postId]);

    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault();
            if (!text.trim() || !user)
                return !user && toast.error("Sign in to comment");
            setSubmitting(true);
            try {
                await addComment(postId, user.uid, {
                    text: text.trim(),
                    authorName: profile?.displayName || user.displayName,
                    authorPhotoURL: profile?.photoURL || user.photoURL,
                    authorVerified: profile?.verified || false,
                });
                setText("");
            } catch {
                toast.error("Failed to post comment");
            } finally {
                setSubmitting(false);
            }
        },
        [text, user, postId, profile],
    );

    return (
        <div>
            <h3
                className="font-display font-bold text-base mb-4"
                style={{ color: "#1F2937" }}
            >
                Comments
                {comments.length > 0 && (
                    <span style={{ color: "#6B7280", fontWeight: 500 }}>
                        {" "}
                        ({comments.length})
                    </span>
                )}
            </h3>

            {user && (
                <form
                    onSubmit={handleSubmit}
                    className="flex items-center gap-2 mb-6"
                >
                    <Avatar
                        src={profile?.photoURL}
                        name={profile?.displayName}
                        size={36}
                    />
                    <div
                        className="flex-1 flex items-center gap-2 rounded-2xl border px-3 py-2"
                        style={{
                            background: "#FFFDF8",
                            borderColor: "#D6D3C9",
                        }}
                    >
                        <input
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 text-sm outline-none bg-transparent"
                            style={{
                                color: "#1F2937",
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                            }}
                            maxLength={500}
                        />
                        <button
                            type="submit"
                            disabled={submitting || !text.trim()}
                            className="p-1.5 rounded-xl"
                            style={{
                                background: text.trim() ? "#556B2F" : "#D6D3C9",
                            }}
                        >
                            {submitting ? (
                                <Loader2
                                    size={14}
                                    className="animate-spin"
                                    color="white"
                                />
                            ) : (
                                <Send size={14} color="white" />
                            )}
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2
                        size={20}
                        className="animate-spin"
                        style={{ color: "#556B2F" }}
                    />
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-4xl mb-2" aria-hidden="true">
                        💬
                    </div>
                    <p className="text-sm" style={{ color: "#6B7280" }}>
                        No comments yet. Be the first!
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {comments.map((c) => (
                        <CommentItem
                            key={c.id}
                            comment={c}
                            postId={postId}
                            authorMap={authorMap}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
