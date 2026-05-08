export function SkeletonLine({ width = "100%", height = 14 }) {
    return <div className="skeleton rounded-lg" style={{ width, height }} />;
}

export function PostCardSkeleton() {
    return (
        <div
            className="rounded-2xl p-4 border"
            style={{ background: "#FFFDF8", borderColor: "#D6D3C9" }}
        >
            <div className="flex items-center gap-3 mb-3">
                <div
                    className="skeleton rounded-full"
                    style={{ width: 40, height: 40 }}
                />
                <div className="flex-1 flex flex-col gap-2">
                    <SkeletonLine width="40%" height={12} />
                    <SkeletonLine width="25%" height={10} />
                </div>
            </div>
            <SkeletonLine width="80%" height={16} />
            <div className="mt-2 flex flex-col gap-2">
                <SkeletonLine width="100%" height={11} />
                <SkeletonLine width="70%" height={11} />
            </div>
            <div className="mt-4 flex gap-4">
                <SkeletonLine width={60} height={28} />
                <SkeletonLine width={60} height={28} />
                <SkeletonLine width={60} height={28} />
            </div>
        </div>
    );
}

export default function SkeletonLoader({ count = 3 }) {
    return (
        <div className="flex flex-col gap-3">
            {Array.from({ length: count }).map((_, i) => (
                <PostCardSkeleton key={i} />
            ))}
        </div>
    );
}
