"use client";
import { useEffect, useRef, useState } from "react";

// ─── Color palette ────────────────────────────────────────────────────────────
const PALETTE = [
    "#3266ad",
    "#2a7a4f",
    "#d95f02",
    "#e7298a",
    "#73726c",
    "#7b3fa0",
    "#b07800",
    "#0d7c8a",
];

const GRID_COLOR = "rgba(0,0,0,0.055)";
const TICK_COLOR = "#9ca3af";
const BORDER_RADIUS = 6;

function useChart(canvasRef, type, data, options) {
    useEffect(() => {
        if (!canvasRef.current || typeof window === "undefined") return;
        let chart;
        import("chart.js").then(({ Chart, registerables }) => {
            Chart.register(...registerables);
            chart = new Chart(canvasRef.current, { type, data, options });
        });
        return () => chart?.destroy();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}

// ─── Shared option factories ──────────────────────────────────────────────────
function barOptions(horizontal = false) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: horizontal ? "y" : "x",
        plugins: { legend: { display: false } },
        scales: {
            x: {
                grid: { color: horizontal ? GRID_COLOR : "transparent" },
                border: { display: false },
                ticks: { color: TICK_COLOR, font: { size: 11 } },
            },
            y: {
                grid: { color: horizontal ? "transparent" : GRID_COLOR },
                border: { display: false },
                ticks: { color: TICK_COLOR, font: { size: 11 } },
            },
        },
    };
}

function donutOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: { legend: { display: false } },
    };
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend({ items }) {
    return (
        <div
            style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px 16px",
                marginBottom: 12,
            }}
        >
            {items.map(({ label, color, value }) => (
                <span
                    key={label}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 12,
                        color: "#6b7280",
                    }}
                >
                    <span
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: 2,
                            background: color,
                            flexShrink: 0,
                        }}
                    />
                    {label}
                    {value !== undefined ? ` ${value}%` : ""}
                </span>
            ))}
        </div>
    );
}

// ─── Metric pill ──────────────────────────────────────────────────────────────
function Metric({ value, label, color }) {
    return (
        <div
            style={{
                background: "var(--color-background-secondary, #F8F5EE)",
                borderRadius: 10,
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                flex: 1,
            }}
        >
            <span
                style={{
                    fontSize: 20,
                    fontWeight: 500,
                    color: color || "#1F2937",
                }}
            >
                {value}
            </span>
            <span
                style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center" }}
            >
                {label}
            </span>
        </div>
    );
}

// ─── BarChart ─────────────────────────────────────────────────────────────────
export function BarChart({ data, title, horizontal = false }) {
    const ref = useRef(null);
    if (!data || data.length === 0) return null;

    const colors = data.map((_, i) => PALETTE[i % PALETTE.length]);
    const chartData = {
        labels: data.map((d) => d.label),
        datasets: [
            {
                data: data.map((d) => d.value),
                backgroundColor: colors,
                borderRadius: BORDER_RADIUS,
                borderSkipped: false,
            },
        ],
    };
    const height = horizontal ? Math.max(data.length * 40 + 60, 160) : 220;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useChart(ref, "bar", chartData, barOptions(horizontal));

    const total = data.reduce((s, d) => s + d.value, 0);

    return (
        <div
            style={{
                background: "#FFFDF8",
                border: "0.5px solid #D6D3C9",
                borderRadius: 14,
                padding: 16,
            }}
        >
            {title && (
                <p
                    style={{
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color: "#9CA3AF",
                        marginBottom: 12,
                    }}
                >
                    {title}
                </p>
            )}
            <Legend
                items={data.map((d, i) => ({
                    label: d.label,
                    color: colors[i],
                    value: total > 0 ? Math.round((d.value / total) * 100) : 0,
                }))}
            />
            <div style={{ position: "relative", width: "100%", height }}>
                <canvas
                    ref={ref}
                    role="img"
                    aria-label={`Bar chart: ${title || "data"}`}
                />
            </div>
        </div>
    );
}

// ─── PieChart (donut) ─────────────────────────────────────────────────────────
export function PieChart({ data, title }) {
    const ref = useRef(null);
    if (!data || data.length === 0) return null;

    const total = data.reduce((s, d) => s + d.value, 0);
    const colors = data.map((_, i) => PALETTE[i % PALETTE.length]);

    const chartData = {
        labels: data.map((d) => d.label),
        datasets: [
            {
                data: data.map((d) => d.value),
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: "#FFFDF8",
            },
        ],
    };

    useChart(ref, "doughnut", chartData, donutOptions());

    return (
        <div
            style={{
                background: "#FFFDF8",
                border: "0.5px solid #D6D3C9",
                borderRadius: 14,
                padding: 16,
            }}
        >
            {title && (
                <p
                    style={{
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color: "#9CA3AF",
                        marginBottom: 12,
                    }}
                >
                    {title}
                </p>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div
                    style={{
                        position: "relative",
                        width: 110,
                        height: 110,
                        flexShrink: 0,
                    }}
                >
                    <canvas
                        ref={ref}
                        role="img"
                        aria-label={`Donut chart: ${title || "data"}`}
                    />
                </div>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 7,
                        flex: 1,
                    }}
                >
                    {data.map((d, i) => {
                        const pct =
                            total > 0 ? Math.round((d.value / total) * 100) : 0;
                        return (
                            <div
                                key={d.label}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                <span
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 2,
                                        background: colors[i],
                                        flexShrink: 0,
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: "#374151",
                                        flex: 1,
                                    }}
                                >
                                    {d.label}
                                </span>
                                <span
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 500,
                                        color: colors[i],
                                    }}
                                >
                                    {pct}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── PercentageIndicator ──────────────────────────────────────────────────────
export function PercentageIndicator({
    value,
    label,
    color = "#556B2F",
    size = 80,
}) {
    const r = (size / 2) * 0.78;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - Math.min(Math.max(value, 0), 100) / 100);
    const cx = size / 2;
    const cy = size / 2;

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
            }}
        >
            <div style={{ position: "relative", width: size, height: size }}>
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
                        stroke="#EDE9DF"
                        strokeWidth={size * 0.075}
                    />
                    <circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="none"
                        stroke={color}
                        strokeWidth={size * 0.075}
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{
                            transition:
                                "stroke-dashoffset 0.9s cubic-bezier(0.34,1.2,0.64,1)",
                        }}
                    />
                </svg>
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <span
                        style={{
                            fontSize: size * 0.18,
                            fontWeight: 600,
                            color,
                        }}
                    >
                        {value}%
                    </span>
                </div>
            </div>
            {label && (
                <span
                    style={{
                        fontSize: 11,
                        color: "#9CA3AF",
                        textAlign: "center",
                        maxWidth: size + 16,
                    }}
                >
                    {label}
                </span>
            )}
        </div>
    );
}

// ─── DemographicsPanel — tabbed view of all breakdown charts ─────────────────
// Pass `votes` array and `pollOptions` array (strings) for a full demographics breakdown.
// Each vote should have { optionIndex, demographics: { gender, age, stateOfOrigin, religion, institutionType, platoonNumber, campLocation } }
export function DemographicsPanel({
    votes = [],
    pollOptions = [],
    totalVotes = 0,
}) {
    const TABS = [
        { id: "results", label: "Results" },
        { id: "gender", label: "Gender" },
        { id: "age", label: "Age group" },
        { id: "state", label: "State" },
        { id: "religion", label: "Religion" },
        { id: "institution", label: "Institution" },
    ];
    const [active, setActive] = useState("results");

    // Aggregate helper
    const aggregate = (field) => {
        const counts = {};
        votes.forEach((v) => {
            const key = v.demographics?.[field] || "Unknown";
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([label, value]) => ({ label, value }));
    };

    // Results breakdown
    const resultsData = (pollOptions || []).map((text, i) => ({
        label: text,
        value: votes.filter((v) => v.optionIndex === i).length,
    }));

    const uniqueStates = new Set(
        votes.map((v) => v.demographics?.stateOfOrigin).filter(Boolean),
    ).size;
    const genderCounts = aggregate("gender");
    const topGender = genderCounts[0]?.label || "—";

    const tabData = {
        results: resultsData,
        gender: aggregate("gender"),
        age: aggregate("age"),
        state: aggregate("stateOfOrigin"),
        religion: aggregate("religion"),
        institution: aggregate("institutionType"),
    };

    const useDonut = (id) => ["gender", "religion"].includes(id);

    return (
        <div>
            {/* Summary metrics */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <Metric
                    value={totalVotes || votes.length}
                    label="Total votes"
                    color="#556B2F"
                />
                <Metric value={uniqueStates} label="States" color="#3266ad" />
                <Metric value={topGender} label="Top gender" color="#d95f02" />
            </div>

            {/* Tab strip */}
            <div
                style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    marginBottom: 12,
                }}
            >
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setActive(t.id)}
                        style={{
                            fontSize: 12,
                            fontWeight: 500,
                            padding: "5px 12px",
                            borderRadius: 999,
                            border:
                                active === t.id
                                    ? "none"
                                    : "0.5px solid #D6D3C9",
                            background:
                                active === t.id ? "#EDF2E8" : "transparent",
                            color: active === t.id ? "#556B2F" : "#9CA3AF",
                            cursor: "pointer",
                            transition: "background .15s, color .15s",
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Active chart */}
            {tabData[active]?.length > 0 ? (
                useDonut(active) ? (
                    <PieChart data={tabData[active]} />
                ) : (
                    <BarChart
                        data={tabData[active]}
                        horizontal={["state", "age"].includes(active)}
                    />
                )
            ) : (
                <div
                    style={{
                        background: "#F8F5EE",
                        border: "0.5px solid #D6D3C9",
                        borderRadius: 14,
                        padding: "32px 16px",
                        textAlign: "center",
                        color: "#9CA3AF",
                        fontSize: 13,
                    }}
                >
                    Not enough data yet
                </div>
            )}
        </div>
    );
}
