import { useEffect, useRef, useCallback } from "react";

export function useInfiniteScroll(
    onLoadMore,
    { enabled = true, rootMargin = "200px" } = {},
) {
    const sentinelRef = useRef(null);
    const observerRef = useRef(null);

    const observe = useCallback(() => {
        if (observerRef.current) observerRef.current.disconnect();
        if (!enabled) return;
        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) onLoadMore();
            },
            { rootMargin },
        );
        if (sentinelRef.current)
            observerRef.current.observe(sentinelRef.current);
    }, [onLoadMore, enabled, rootMargin]);

    useEffect(() => {
        observe();
        return () => observerRef.current?.disconnect();
    }, [observe]);

    return sentinelRef;
}
