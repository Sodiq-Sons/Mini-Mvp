import { useState, useEffect, useRef } from "react";
import { subscribeToNotifications } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";

export function useNotifications() {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const uidRef = useRef(null);

    useEffect(() => {
        if (!user || user.uid === uidRef.current) return;
        uidRef.current = user.uid;

        const unsub = subscribeToNotifications(user.uid, (notifs) => {
            setNotifications(notifs);
            setUnreadCount(notifs.length);
        });

        return () => {
            uidRef.current = null;
            unsub();
        };
    }, [user]);

    return { unreadCount, notifications };
}
