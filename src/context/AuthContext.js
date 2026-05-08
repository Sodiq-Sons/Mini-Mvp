"use client";
import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useMemo,
} from "react";
import { onAuthChange, getUserProfile } from "@/lib/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(undefined); // undefined = not yet checked
    const [profile, setProfile] = useState(null);

    const refreshProfile = useCallback(async (uid) => {
        if (!uid) return;
        try {
            const p = await getUserProfile(uid);
            setProfile(p);
        } catch (error) {
            if (error.code === "unavailable") {
                await new Promise((res) => setTimeout(res, 500));
                try {
                    const p = await getUserProfile(uid);
                    setProfile(p);
                } catch {}
            }
        }
    }, []);

    useEffect(() => {
        const unsub = onAuthChange(async (firebaseUser) => {
            setUser(firebaseUser ?? null);
            if (firebaseUser) {
                await refreshProfile(firebaseUser.uid);
            } else {
                setProfile(null);
            }
        });
        return unsub;
    }, [refreshProfile]);

    // Memoize context value so consumers don't re-render unless data changes
    const value = useMemo(
        () => ({
            user,
            profile,
            loading: user === undefined, // true while Firebase hasn't responded
            refreshProfile,
        }),
        [user, profile, refreshProfile],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};
