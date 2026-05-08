import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    serverTimestamp,
    increment,
    arrayUnion,
    arrayRemove,
    onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── In-memory cache for user profiles (avoids repeated Firestore reads) ─────
const userCache = new Map();
const pendingUserFetches = new Map(); // deduplicates concurrent fetches for same uid

export const getUserById = async (uid) => {
    if (userCache.has(uid)) return userCache.get(uid);
    if (pendingUserFetches.has(uid)) return pendingUserFetches.get(uid);

    const promise = getDoc(doc(db, "users", uid))
        .then((snap) => {
            const data = snap.exists() ? { id: snap.id, ...snap.data() } : null;
            userCache.set(uid, data);
            pendingUserFetches.delete(uid);
            return data;
        })
        .catch((err) => {
            pendingUserFetches.delete(uid);
            throw err;
        });

    pendingUserFetches.set(uid, promise);
    return promise;
};

export const updateUserProfile = async (uid, data) => {
    await updateDoc(doc(db, "users", uid), {
        ...data,
        updatedAt: serverTimestamp(),
    });
    // Invalidate cache
    userCache.delete(uid);
};

export const getTopUsers = async (limitCount = 10) => {
    const snap = await getDocs(
        query(
            collection(db, "users"),
            orderBy("likeCount", "desc"),
            limit(limitCount),
        ),
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ─── Posts ────────────────────────────────────────────────────────────────────

export const createPost = async (uid, data) => {
    const ref = doc(collection(db, "posts"));
    await setDoc(ref, {
        ...data,
        authorId: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likeCount: 0,
        dislikeCount: 0,
        commentCount: 0,
        viewCount: 0,
        trendScore: 0,
        likedBy: [],
        dislikedBy: [],
    });
    // Fire-and-forget user counter (non-blocking)
    updateDoc(doc(db, "users", uid), { postCount: increment(1) }).catch(
        () => {},
    );
    userCache.delete(uid);
    return ref.id;
};

export const getPosts = async (
    filter = "latest",
    lastDoc = null,
    pageSize = 10,
) => {
    const base = collection(db, "posts");
    let q =
        filter === "trending"
            ? query(base, orderBy("trendScore", "desc"), limit(pageSize))
            : query(base, orderBy("createdAt", "desc"), limit(pageSize));

    if (lastDoc) q = query(q, startAfter(lastDoc));

    const snap = await getDocs(q);
    return {
        posts: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
        lastDoc: snap.docs[snap.docs.length - 1] || null,
        hasMore: snap.docs.length === pageSize,
    };
};

export const getPostById = async (postId) => {
    const snap = await getDoc(doc(db, "posts", postId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const likePost = async (postId, uid, action) => {
    const ref = doc(db, "posts", postId);
    const updates = {
        like: {
            likeCount: increment(1),
            likedBy: arrayUnion(uid),
            dislikeCount: increment(-1),
            dislikedBy: arrayRemove(uid),
            trendScore: increment(2),
        },
        unlike: { likeCount: increment(-1), likedBy: arrayRemove(uid) },
        dislike: {
            dislikeCount: increment(1),
            dislikedBy: arrayUnion(uid),
            likeCount: increment(-1),
            likedBy: arrayRemove(uid),
        },
        undislike: {
            dislikeCount: increment(-1),
            dislikedBy: arrayRemove(uid),
        },
    };
    if (updates[action]) {
        await updateDoc(ref, updates[action]);
        // Activity log is non-blocking
        logActivity(uid, { type: action, postId }).catch(() => {});
    }
};

export const getUserPosts = async (uid, lastDoc = null, pageSize = 10) => {
    let q = query(
        collection(db, "posts"),
        where("authorId", "==", uid),
        orderBy("createdAt", "desc"),
        limit(pageSize),
    );
    if (lastDoc) q = query(q, startAfter(lastDoc));
    const snap = await getDocs(q);
    return {
        posts: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
        lastDoc: snap.docs[snap.docs.length - 1] || null,
        hasMore: snap.docs.length === pageSize,
    };
};

export const subscribeToPost = (postId, callback) => {
    return onSnapshot(doc(db, "posts", postId), (snap) => {
        if (snap.exists()) callback({ id: snap.id, ...snap.data() });
    });
};

// ─── Comments ─────────────────────────────────────────────────────────────────

export const addComment = async (postId, uid, data) => {
    const ref = doc(collection(db, "posts", postId, "comments"));
    await setDoc(ref, {
        ...data,
        authorId: uid,
        createdAt: serverTimestamp(),
        likeCount: 0,
        likedBy: [],
        replies: [],
    });
    // Non-blocking counters
    const postRef = doc(db, "posts", postId);
    updateDoc(postRef, {
        commentCount: increment(1),
        trendScore: increment(1),
    }).catch(() => {});
    updateDoc(doc(db, "users", uid), { commentCount: increment(1) }).catch(
        () => {},
    );
    userCache.delete(uid);
    logActivity(uid, { type: "comment", postId, commentId: ref.id }).catch(
        () => {},
    );
    return ref.id;
};

export const likeComment = async (postId, commentId, uid) => {
    const ref = doc(db, "posts", postId, "comments", commentId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const liked = snap.data().likedBy?.includes(uid);
    await updateDoc(ref, {
        likeCount: increment(liked ? -1 : 1),
        likedBy: liked ? arrayRemove(uid) : arrayUnion(uid),
    });
};

export const subscribeToComments = (postId, callback) => {
    return onSnapshot(
        query(
            collection(db, "posts", postId, "comments"),
            orderBy("createdAt", "asc"),
        ),
        (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
};

// ─── Polls ────────────────────────────────────────────────────────────────────

export const submitVote = async (
    postId,
    pollId,
    optionIndex,
    uid,
    userDemographics,
) => {
    const voteRef = doc(db, "votes", `${pollId}_${uid}`);
    const existing = await getDoc(voteRef);
    if (existing.exists()) return { error: "already_voted" };

    await setDoc(voteRef, {
        postId,
        pollId,
        optionIndex,
        uid,
        demographics: userDemographics,
        createdAt: serverTimestamp(),
    });

    const pollSnap = await getDoc(doc(db, "polls", pollId));
    if (pollSnap.exists()) {
        const opts = [...(pollSnap.data().options || [])];
        opts[optionIndex] = {
            ...opts[optionIndex],
            voteCount: (opts[optionIndex].voteCount || 0) + 1,
        };
        await updateDoc(doc(db, "polls", pollId), {
            options: opts,
            totalVotes: increment(1),
        });
    }

    updateDoc(doc(db, "users", uid), { pollVoteCount: increment(1) }).catch(
        () => {},
    );
    userCache.delete(uid);
    logActivity(uid, { type: "vote", postId, pollId }).catch(() => {});
    return { success: true };
};

export const getPollVotes = async (pollId) => {
    const snap = await getDocs(
        query(collection(db, "votes"), where("pollId", "==", pollId)),
    );
    return snap.docs.map((d) => d.data());
};

export const getPollById = async (pollId) => {
    const snap = await getDoc(doc(db, "polls", pollId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const createPoll = async (postId, uid, pollData) => {
    const ref = doc(collection(db, "polls"));
    await setDoc(ref, {
        ...pollData,
        postId,
        authorId: uid,
        createdAt: serverTimestamp(),
        totalVotes: 0,
    });
    return ref.id;
};

export const hasUserVoted = async (pollId, uid) => {
    const snap = await getDoc(doc(db, "votes", `${pollId}_${uid}`));
    return snap.exists() ? snap.data() : null;
};

// ─── Activities (fire-and-forget) ─────────────────────────────────────────────

export const logActivity = async (uid, data) => {
    const ref = doc(collection(db, "activities"));
    return setDoc(ref, { uid, ...data, createdAt: serverTimestamp() });
};

export const getUserActivities = async (uid, lastDoc = null, pageSize = 20) => {
    let q = query(
        collection(db, "activities"),
        where("uid", "==", uid),
        orderBy("createdAt", "desc"),
        limit(pageSize),
    );
    if (lastDoc) q = query(q, startAfter(lastDoc));
    const snap = await getDocs(q);
    return {
        activities: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
        lastDoc: snap.docs[snap.docs.length - 1] || null,
        hasMore: snap.docs.length === pageSize,
    };
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const createNotification = async (toUid, data) => {
    const ref = doc(collection(db, "notifications"));
    return setDoc(ref, {
        ...data,
        toUid,
        read: false,
        createdAt: serverTimestamp(),
    });
};

export const getNotifications = async (uid, limitCount = 20) => {
    const snap = await getDocs(
        query(
            collection(db, "notifications"),
            where("toUid", "==", uid),
            orderBy("createdAt", "desc"),
            limit(limitCount),
        ),
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const markNotificationRead = async (notifId) => {
    await updateDoc(doc(db, "notifications", notifId), { read: true });
};

export const subscribeToNotifications = (uid, callback) => {
    return onSnapshot(
        query(
            collection(db, "notifications"),
            where("toUid", "==", uid),
            where("read", "==", false),
            orderBy("createdAt", "desc"),
            limit(20),
        ),
        (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
};

// ─── Trending ─────────────────────────────────────────────────────────────────

export const getTrendingPosts = async (limitCount = 10) => {
    const snap = await getDocs(
        query(
            collection(db, "posts"),
            orderBy("trendScore", "desc"),
            limit(limitCount),
        ),
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getTrendingUsers = async (limitCount = 10) => {
    const snap = await getDocs(
        query(
            collection(db, "users"),
            orderBy("likeCount", "desc"),
            limit(limitCount),
        ),
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getTrendingPlatoons = async () => {
    const snap = await getDocs(
        query(
            collection(db, "posts"),
            orderBy("createdAt", "desc"),
            limit(100),
        ),
    );
    const platoonCounts = {};
    snap.docs.forEach((d) => {
        const p = d.data().authorPlatoon;
        if (p) platoonCounts[p] = (platoonCounts[p] || 0) + 1;
    });
    return Object.entries(platoonCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([platoon, count]) => ({ platoon, count }));
};
