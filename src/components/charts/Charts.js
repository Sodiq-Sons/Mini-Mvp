"use client";

const COLORS = [
    "#556B2F",
    "#F59E0B",
    "#3B82F6",
    "#EF4444",
    "#8B5CF6",
    "#10B981",
    "#F97316",
    "#EC4899",
];

export function BarChart({ data, title }) {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data.map((d) => d.value));

    return (
        <div
            className="rounded-2xl border p-4"
            style={{ background: "#FFFDF8", borderColor: "#D6D3C9" }}
        >
            {title && (
                <h4
                    className="font-bold text-sm mb-3"
                    style={{ color: "#1F2937" }}
                >
                    {title}
                </h4>
            )}
            <div className="flex flex-col gap-2.5">
                {data.map((item, i) => {
                    const pct = max > 0 ? (item.value / max) * 100 : 0;
                    const displayPct =
                        max > 0
                            ? Math.round(
                                  (item.value /
                                      data.reduce((s, d) => s + d.value, 0)) *
                                      100,
                              )
                            : 0;
                    return (
                        <div
                            key={item.label}
                            className="flex items-center gap-2"
                        >
                            <span
                                className="text-xs w-24 truncate"
                                style={{ color: "#6B7280" }}
                            >
                                {item.label}
                            </span>
                            <div
                                className="flex-1 h-2.5 rounded-full overflow-hidden"
                                style={{ background: "#F3F0E8" }}
                            >
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${pct}%`,
                                        background: COLORS[i % COLORS.length],
                                        transition:
                                            "width 0.7s cubic-bezier(0.34,1.56,0.64,1)",
                                    }}
                                />
                            </div>
                            <span
                                className="text-xs font-bold w-8 text-right"
                                style={{ color: COLORS[i % COLORS.length] }}
                            >
                                {displayPct}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function PieChart({ data, title }) {
    if (!data || data.length === 0) return null;
    const total = data.reduce((s, d) => s + d.value, 0);

    let cumulative = 0;
    const slices = data.map((item, i) => {
        const pct = total > 0 ? item.value / total : 0;
        const start = cumulative;
        cumulative += pct;
        return { ...item, pct, start, color: COLORS[i % COLORS.length] };
    });

    const polarToCartesian = (cx, cy, r, degrees) => {
        const rad = ((degrees - 90) * Math.PI) / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };

    const describeArc = (cx, cy, r, startPct, endPct) => {
        const start = polarToCartesian(cx, cy, r, startPct * 360);
        const end = polarToCartesian(cx, cy, r, endPct * 360);
        const largeArc = endPct - startPct > 0.5 ? 1 : 0;
        return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
    };

    return (
        <div
            className="rounded-2xl border p-4"
            style={{ background: "#FFFDF8", borderColor: "#D6D3C9" }}
        >
            {title && (
                <h4
                    className="font-bold text-sm mb-3"
                    style={{ color: "#1F2937" }}
                >
                    {title}
                </h4>
            )}
            <div className="flex items-center gap-4">
                <svg
                    width="100"
                    height="100"
                    viewBox="0 0 100 100"
                    className="flex-shrink-0"
                >
                    {slices.map((s) => (
                        <path
                            key={s.label}
                            d={describeArc(
                                50,
                                50,
                                45,
                                s.start,
                                s.start + s.pct,
                            )}
                            fill={s.color}
                            stroke="white"
                            strokeWidth="1.5"
                        />
                    ))}
                    <circle cx="50" cy="50" r="20" fill="#FFFDF8" />
                </svg>
                <div className="flex flex-col gap-1.5 flex-1">
                    {slices.map((s) => (
                        <div key={s.label} className="flex items-center gap-2">
                            <div
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ background: s.color }}
                            />
                            <span
                                className="text-xs truncate"
                                style={{ color: "#6B7280" }}
                            >
                                {s.label}
                            </span>
                            <span
                                className="text-xs font-bold ml-auto"
                                style={{ color: s.color }}
                            >
                                {Math.round(s.pct * 100)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function PercentageIndicator({
    value,
    label,
    color = "#556B2F",
    size = 80,
}) {
    const r = (size / 2) * 0.8;
    const circumference = 2 * Math.PI * r;
    const dashOffset = circumference * (1 - value / 100);
    const cx = size / 2;
    const cy = size / 2;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width: size, height: size }}>
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    style={{ transform: "rotate(-90deg)" }}
                >
                    <circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="none"
                        stroke="#F3F0E8"
                        strokeWidth="6"
                    />
                    <circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="none"
                        stroke={color}
                        strokeWidth="6"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        style={{
                            transition:
                                "stroke-dashoffset 0.8s cubic-bezier(0.34,1.56,0.64,1)",
                        }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span
                        className="font-display font-black text-sm"
                        style={{ color }}
                    >
                        {value}%
                    </span>
                </div>
            </div>
            {label && (
                <span
                    className="text-xs font-semibold text-center"
                    style={{ color: "#6B7280" }}
                >
                    {label}
                </span>
            )}
        </div>
    );
}
