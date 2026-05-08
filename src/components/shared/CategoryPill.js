const CATEGORY_STYLES = {
    food: { bg: "#FEF3C7", color: "#92400E", label: "🍛 Food" },
    gist: { bg: "#D1FAE5", color: "#065F46", label: "💬 Camp Gist" },
    issues: { bg: "#FEE2E2", color: "#991B1B", label: "⚠️ Issues" },
    poll: { bg: "#E0E7FF", color: "#3730A3", label: "📊 Poll" },
    story: { bg: "#F3E8FF", color: "#6B21A8", label: "📖 Story" },
    trending: { bg: "#FFEDD5", color: "#9A3412", label: "🔥 Trending" },
    general: { bg: "#F3F4F6", color: "#374151", label: "💡 General" },
};

export default function CategoryPill({ category, size = "sm" }) {
    const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.general;
    return (
        <span
            className="inline-flex items-center rounded-full font-semibold uppercase tracking-wide"
            style={{
                background: style.bg,
                color: style.color,
                padding: size === "xs" ? "2px 8px" : "3px 10px",
                fontSize: size === "xs" ? "10px" : "11px",
            }}
        >
            {style.label}
        </span>
    );
}
