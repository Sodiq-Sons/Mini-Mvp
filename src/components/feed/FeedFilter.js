"use client";
import { useRef, memo } from "react";

const FILTERS = [
    { key: "latest", label: "✨ Latest" },
    { key: "trending", label: "🔥 Trending" },
    { key: "food", label: "🍛 Food" },
    { key: "gist", label: "💬 Gist" },
    { key: "issues", label: "⚠️ Issues" },
    { key: "poll", label: "📊 Polls" },
    { key: "story", label: "📖 Stories" },
];

const FeedFilter = memo(function FeedFilter({ active, onChange }) {
    const scrollRef = useRef();

    return (
        <div
            ref={scrollRef}
            className="flex gap-2 overflow-x-auto px-4 py-3 feed-filter-scroll"
        >
            {FILTERS.map(({ key, label }) => (
                <button
                    key={key}
                    onClick={() => onChange(key)}
                    className="shrink-0 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap active:scale-95 feed-filter-btn"
                    data-active={active === key}
                    aria-pressed={active === key}
                >
                    {label}
                </button>
            ))}
        </div>
    );
});

export default FeedFilter;
