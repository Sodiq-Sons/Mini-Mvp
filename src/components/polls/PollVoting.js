"use client";
import { useState, useEffect } from "react";
import {
    BarChart2,
    Users,
    CheckCircle2,
    Loader2,
    RefreshCw,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import {
    submitVote,
    getPollById,
    getPollVotes,
    hasUserVoted,
} from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { DemographicsPanel } from "../charts/Charts";

// ─── Palette for demographic segments ────────────────────────────────────────
const SEGMENT_COLORS = [
    { bg: "#4F7942", light: "#EDF2E8", text: "#fff" },
    { bg: "#D4845A", light: "#FDF0E8", text: "#fff" },
    { bg: "#5B7FA6", light: "#E8F0F8", text: "#fff" },
    { bg: "#A66B9A", light: "#F5EAF5", text: "#fff" },
    { bg: "#C4A24A", light: "#FBF5E2", text: "#fff" },
    { bg: "#5A9E8F", light: "#E5F4F2", text: "#fff" },
];

// ─── Animated stacked bar for a demographic breakdown ────────────────────────
function StackedBar({ segments, total }) {
    return (
        <div className="flex h-5 w-full rounded-full overflow-hidden gap-px">
            {segments.map((s, i) => {
                const pct = total > 0 ? (s.count / total) * 100 : 0;
                if (pct < 1) return null;
                return (
                    <div
                        key={s.label}
                        title={`${s.label}: ${Math.round(pct)}%`}
                        style={{
                            width: `${pct}%`,
                            background:
                                SEGMENT_COLORS[i % SEGMENT_COLORS.length].bg,
                            transition: `width 0.8s cubic-bezier(0.34,1.2,0.64,1) ${i * 60}ms`,
                        }}
                    />
                );
            })}
        </div>
    );
}

// ─── Single demographic card ──────────────────────────────────────────────────
function DemoCard({ votes, field, title, emoji }) {
    const breakdown = {};
    votes.forEach((v) => {
        const key = v.demographics?.[field] || "Unknown";
        breakdown[key] = (breakdown[key] || 0) + 1;
    });

    const segments = Object.entries(breakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([label, count]) => ({ label, count }));

    const total = segments.reduce((s, seg) => s + seg.count, 0);
    if (total === 0) return null;

    const top = segments[0];
    const topPct = Math.round((top.count / total) * 100);

    return (
        <div
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: "#F8F5EE", border: "1px solid #E8E4D8" }}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-base">{emoji}</span>
                    <span
                        className="text-xs font-bold tracking-wide uppercase"
                        style={{ color: "#556B2F" }}
                    >
                        {title}
                    </span>
                </div>
                <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: SEGMENT_COLORS[0].bg, color: "#fff" }}
                >
                    #{top.label} leads
                </span>
            </div>

            {/* Stacked bar */}
            <StackedBar segments={segments} total={total} />

            {/* Legend */}
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                {segments.map((s, i) => {
                    const pct = Math.round((s.count / total) * 100);
                    const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
                    return (
                        <div
                            key={s.label}
                            className="flex items-center gap-1.5"
                        >
                            <div
                                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                                style={{ background: color.bg }}
                            />
                            <span
                                className="text-[11px]"
                                style={{ color: "#374151" }}
                            >
                                {s.label}
                            </span>
                            <span
                                className="text-[11px] font-bold"
                                style={{ color: color.bg }}
                            >
                                {pct}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Big summary stat ─────────────────────────────────────────────────────────
function StatPill({ value, label, color }) {
    return (
        <div
            className="flex-1 rounded-2xl p-3 flex flex-col items-center gap-0.5"
            style={{ background: "#F0EDE4" }}
        >
            <span className="text-lg font-black" style={{ color }}>
                {value}
            </span>
            <span
                className="text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: "#9CA3AF" }}
            >
                {label}
            </span>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PollVoting({ postId, pollId }) {
    const { user, profile } = useAuth();
    const [poll, setPoll] = useState(null);
    const [votes, setVotes] = useState([]);
    const [userVote, setUserVote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [changingVote, setChangingVote] = useState(false);

    useEffect(() => {
        if (!pollId) return;
        const load = async () => {
            const [pollData, votesData, uv] = await Promise.all([
                getPollById(pollId),
                getPollVotes(pollId),
                user ? hasUserVoted(pollId, user.uid) : null,
            ]);
            setPoll(pollData);
            setVotes(votesData);
            setUserVote(uv);
            setLoading(false);
        };
        load();
    }, [pollId, user]);

    const buildDemographics = () => ({
        age: profile?.age
            ? profile.age < 22
                ? "Under 22"
                : profile.age < 25
                  ? "22–24"
                  : profile.age < 28
                    ? "25–27"
                    : "28+"
            : "Unknown",
        gender: profile?.gender || "Unknown",
        religion: profile?.religion || "Unknown",
        stateOfOrigin: profile?.stateOfOrigin || "Unknown",
        campLocation: profile?.campLocation || "Unknown",
        institutionType: profile?.institutionType || "Unknown",
        platoonNumber: profile?.platoonNumber
            ? `Platoon ${profile.platoonNumber}`
            : "Unknown",
    });

    const handleVote = async (optionIndex) => {
        if (!user) return toast.error("Sign in to vote");
        if (voting) return;

        // If same choice, do nothing
        if (userVote?.optionIndex === optionIndex) {
            setChangingVote(false);
            return;
        }

        setVoting(true);
        const demographics = buildDemographics();

        try {
            const result = await submitVote(
                postId,
                pollId,
                optionIndex,
                user.uid,
                demographics,
            );

            if (result.error === "same_vote") {
                setChangingVote(false);
                return;
            }
            if (result.error === "poll_not_found") {
                toast.error("Poll not found");
                return;
            }

            const prevIndex = result.changed ? userVote?.optionIndex : null;
            const newVote = { optionIndex, demographics };

            setUserVote(newVote);
            setVotes((prev) => {
                const filtered = prev.filter((v) => v.uid !== user.uid);
                return [...filtered, { ...newVote, uid: user.uid }];
            });
            setPoll((prev) => ({
                ...prev,
                totalVotes: result.changed
                    ? prev.totalVotes
                    : (prev.totalVotes || 0) + 1,
                options: prev.options.map((o, i) => {
                    if (i === optionIndex)
                        return { ...o, voteCount: (o.voteCount || 0) + 1 };
                    if (result.changed && i === prevIndex)
                        return {
                            ...o,
                            voteCount: Math.max(0, (o.voteCount || 0) - 1),
                        };
                    return o;
                }),
            }));

            setChangingVote(false);
            toast.success(
                result.changed ? "Vote changed! ✅" : "Vote recorded! 🎉",
            );
        } catch {
            toast.error("Something went wrong");
        } finally {
            setVoting(false);
        }
    };

    if (loading)
        return (
            <div
                className="rounded-2xl p-4 border"
                style={{ background: "#FFFDF8", borderColor: "#D6D3C9" }}
            >
                <div className="flex justify-center py-6">
                    <Loader2
                        size={24}
                        className="animate-spin"
                        style={{ color: "#556B2F" }}
                    />
                </div>
            </div>
        );

    if (!poll) return null;

    const totalVotes = poll.totalVotes || 0;
    const hasVoted = !!userVote;
    const isSelecting = !hasVoted || changingVote;

    // Demographics summary stats
    const uniqueStates = new Set(
        votes.map((v) => v.demographics?.stateOfOrigin).filter(Boolean),
    ).size;
    const genderBreakdown = {};
    votes.forEach((v) => {
        const g = v.demographics?.gender || "Unknown";
        genderBreakdown[g] = (genderBreakdown[g] || 0) + 1;
    });
    const topGender = Object.entries(genderBreakdown).sort(
        (a, b) => b[1] - a[1],
    )[0];

    return (
        <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: "#FFFDF8", borderColor: "#D6D3C9" }}
        >
            {/* ── Header ── */}
            <div
                className="px-4 pt-4 pb-3 border-b"
                style={{ borderColor: "#EDE9DF" }}
            >
                <div className="flex items-center gap-2 mb-1">
                    <BarChart2 size={16} style={{ color: "#556B2F" }} />
                    <span
                        className="font-bold text-xs tracking-widest uppercase"
                        style={{ color: "#556B2F" }}
                    >
                        Poll
                    </span>
                    {hasVoted && !changingVote && (
                        <CheckCircle2 size={15} style={{ color: "#10B981" }} />
                    )}
                </div>
                <p
                    className="font-bold text-base leading-snug"
                    style={{ color: "#1F2937" }}
                >
                    {poll.question}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                    <span
                        className="text-xs flex items-center gap-1"
                        style={{ color: "#9CA3AF" }}
                    >
                        <Users size={11} />
                        {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
                    </span>
                    {hasVoted && !changingVote && (
                        <button
                            onClick={() => setChangingVote(true)}
                            className="flex items-center gap-1 text-xs font-semibold"
                            style={{ color: "#556B2F" }}
                        >
                            <RefreshCw size={11} />
                            Change vote
                        </button>
                    )}
                    {changingVote && (
                        <button
                            onClick={() => setChangingVote(false)}
                            className="text-xs font-semibold"
                            style={{ color: "#9CA3AF" }}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* ── Options ── */}
            <div className="p-4 flex flex-col gap-2.5">
                {poll.options?.map((option, i) => {
                    const pct =
                        totalVotes > 0
                            ? Math.round(
                                  ((option.voteCount || 0) / totalVotes) * 100,
                              )
                            : 0;
                    const isUserChoice = userVote?.optionIndex === i;
                    const showResults = hasVoted && !changingVote;

                    return (
                        <button
                            key={i}
                            onClick={() => isSelecting && handleVote(i)}
                            disabled={voting}
                            className="w-full text-left rounded-2xl border overflow-hidden relative"
                            style={{
                                background:
                                    isUserChoice && showResults
                                        ? "#EDF2E8"
                                        : "#F8F5EE",
                                borderColor:
                                    isUserChoice && showResults
                                        ? "#556B2F"
                                        : changingVote && isUserChoice
                                          ? "#A0B580"
                                          : "#D6D3C9",
                                cursor: isSelecting ? "pointer" : "default",
                                transition:
                                    "border-color 0.2s, background 0.2s",
                            }}
                        >
                            {/* Animated fill bar */}
                            {showResults && (
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        width: `${pct}%`,
                                        background: isUserChoice
                                            ? "rgba(85,107,47,0.12)"
                                            : "rgba(200,195,180,0.35)",
                                        transition:
                                            "width 0.8s cubic-bezier(0.34,1.1,0.64,1)",
                                    }}
                                />
                            )}

                            <div className="relative flex items-center justify-between px-4 py-3 gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    {isUserChoice && showResults ? (
                                        <CheckCircle2
                                            size={15}
                                            style={{ color: "#556B2F" }}
                                            className="flex-shrink-0"
                                        />
                                    ) : isSelecting ? (
                                        <div
                                            className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                                            style={{
                                                borderColor: isUserChoice
                                                    ? "#556B2F"
                                                    : "#C4BFB0",
                                            }}
                                        />
                                    ) : null}
                                    <span
                                        className="text-sm font-semibold truncate"
                                        style={{
                                            color:
                                                isUserChoice && showResults
                                                    ? "#556B2F"
                                                    : "#1F2937",
                                        }}
                                    >
                                        {option.text}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {showResults && (
                                        <span
                                            className="text-sm font-black tabular-nums"
                                            style={{
                                                color: isUserChoice
                                                    ? "#556B2F"
                                                    : "#9CA3AF",
                                            }}
                                        >
                                            {pct}%
                                        </span>
                                    )}
                                    {voting && (
                                        <Loader2
                                            size={13}
                                            className="animate-spin"
                                            style={{ color: "#9CA3AF" }}
                                        />
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── Demographics toggle ── */}
            {hasVoted && votes.length >= 2 && (
                <div className="px-4 pb-4">
                    <button
                        onClick={() => setShowAnalytics(!showAnalytics)}
                        className="w-full py-2.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                        style={{
                            background: showAnalytics ? "#EDF2E8" : "#F0EDE4",
                            color: "#556B2F",
                            border: "1.5px solid",
                            borderColor: showAnalytics ? "#556B2F" : "#D6D3C9",
                        }}
                    >
                        <BarChart2 size={15} />
                        {showAnalytics
                            ? "Hide breakdown"
                            : "View who voted what"}
                        {showAnalytics ? (
                            <ChevronUp size={14} />
                        ) : (
                            <ChevronDown size={14} />
                        )}
                    </button>

                    {showAnalytics && (
                        <div className="mt-4">
                            <DemographicsPanel
                                votes={votes}
                                pollOptions={poll.options?.map((o) => o.text)}
                                totalVotes={poll.totalVotes}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
