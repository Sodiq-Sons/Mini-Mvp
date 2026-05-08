import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    signInWithPopup,
    updateProfile,
    onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { googleProvider, auth, db } from "./firebase";

export const signUp = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    return cred.user;
};

export const signIn = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
};

export const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
};

export const logOut = async () => {
    await signOut(auth);
};

export const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
};

export const getUserProfile = async (uid) => {
    try {
        const snap = await getDoc(doc(db, "users", uid));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        // Retry once if offline
        if (error.code === "unavailable") {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const snap = await getDoc(doc(db, "users", uid));
            return snap.exists() ? { id: snap.id, ...snap.data() } : null;
        }
        throw error;
    }
};

export const createUserProfile = async (uid, data) => {
    try {
        await setDoc(
            doc(db, "users", uid),
            {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                verified: false,
                postCount: 0,
                likeCount: 0,
                commentCount: 0,
                pollVoteCount: 0,
                followersCount: 0,
                followingCount: 0,
            },
            { merge: true },
        );
    } catch (error) {
        console.error("Error creating user profile:", error);
        // Retry once if offline
        if (error.code === "unavailable") {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await setDoc(
                doc(db, "users", uid),
                {
                    ...data,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    verified: false,
                    postCount: 0,
                    likeCount: 0,
                    commentCount: 0,
                    pollVoteCount: 0,
                    followersCount: 0,
                    followingCount: 0,
                },
                { merge: true },
            );
        } else {
            throw error;
        }
    }
};

export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};
