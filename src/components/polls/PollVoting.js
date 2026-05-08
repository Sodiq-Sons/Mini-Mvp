"use client";
import { useState, useEffect } from "react";
import { BarChart2, Users, CheckCircle2, Loader2 } from "lucide-react";
import {
    submitVote,
    getPollById,
    getPollVotes,
    hasUserVoted,
} from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

function ProgressBar({ percent, color = "#556B2F" }) {
    return (
        <div
            className="h-2 rounded-full overflow-hidden flex-1"
            style={{ background: "#EDF2E8" }}
        >
            <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${percent}%`, background: color }}
            />
        </div>
    );
}

function DemoChart({ votes, field, title }) {
    const breakdown = {};
    votes.forEach((v) => {
        const key = v.demographics?.[field] || "Unknown";
        if (!breakdown[key]) breakdown[key] = {};
        const optIdx = v.optionIndex;
        breakdown[key][optIdx] = (breakdown[key][optIdx] || 0) + 1;
    });

    const entries = Object.entries(breakdown)
        .sort((a, b) => {
            const aTotal = Object.values(a[1]).reduce((s, n) => s + n, 0);
            const bTotal = Object.values(b[1]).reduce((s, n) => s + n, 0);
            return bTotal - aTotal;
        })
        .slice(0, 6);

    if (entries.length === 0) return null;

    return (
        <div className="mb-4">
            <h4 className="text-xs font-bold mb-2" style={{ color: "#6B7280" }}>
                {title}
            </h4>
            <div className="flex flex-col gap-1.5">
                {entries.map(([key, counts]) => {
                    const total = Object.values(counts).reduce(
                        (s, n) => s + n,
                        0,
                    );
                    const topIdx = Object.keys(counts).sort(
                        (a, b) => counts[b] - counts[a],
                    )[0];
                    const pct = Math.round((counts[topIdx] / total) * 100);
                    return (
                        <div key={key} className="flex items-center gap-2">
                            <span
                                className="text-xs w-24 truncate"
                                style={{ color: "#6B7280" }}
                            >
                                {key}
                            </span>
                            <ProgressBar percent={pct} />
                            <span
                                className="text-xs font-bold w-8 text-right"
                                style={{ color: "#556B2F" }}
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

export default function PollVoting({ postId, pollId }) {
    const { user, profile } = useAuth();
    const [poll, setPoll] = useState(null);
    const [votes, setVotes] = useState([]);
    const [userVote, setUserVote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);

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

    const handleVote = async (optionIndex) => {
        if (!user) return toast.error("Sign in to vote");
        if (userVote) return toast.error("You already voted!");
        setVoting(true);
        try {
            const demographics = {
                age: profile?.age
                    ? profile.age < 22
                        ? "Under 22"
                        : profile.age < 25
                          ? "22-24"
                          : profile.age < 28
                            ? "25-27"
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
            };
            const result = await submitVote(
                postId,
                pollId,
                optionIndex,
                user.uid,
                demographics,
            );
            if (result.error === "already_voted")
                return toast.error("Already voted!");
            const newVote = { optionIndex, demographics };
            setUserVote(newVote);
            setVotes((prev) => [...prev, { ...newVote, uid: user.uid }]);
            setPoll((prev) => ({
                ...prev,
                totalVotes: (prev.totalVotes || 0) + 1,
                options: prev.options.map((o, i) =>
                    i === optionIndex
                        ? { ...o, voteCount: (o.voteCount || 0) + 1 }
                        : o,
                ),
            }));
            toast.success("Vote recorded! 🎉");
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

    return (
        <div
            className="rounded-2xl border"
            style={{ background: "#FFFDF8", borderColor: "#D6D3C9" }}
        >
            <div className="p-4 border-b" style={{ borderColor: "#D6D3C9" }}>
                <div className="flex items-center gap-2">
                    <BarChart2 size={18} style={{ color: "#556B2F" }} />
                    <span
                        className="font-bold text-sm"
                        style={{ color: "#556B2F" }}
                    >
                        Poll
                    </span>
                    {hasVoted && (
                        <CheckCircle2 size={16} style={{ color: "#10B981" }} />
                    )}
                </div>
                <p
                    className="font-display font-bold text-base mt-1"
                    style={{ color: "#1F2937" }}
                >
                    {poll.question}
                </p>
                <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                    <Users size={12} className="inline mr-1" />
                    {totalVotes} votes
                </p>
            </div>

            <div className="p-4 flex flex-col gap-2.5">
                {poll.options?.map((option, i) => {
                    const pct =
                        totalVotes > 0
                            ? Math.round(
                                  ((option.voteCount || 0) / totalVotes) * 100,
                              )
                            : 0;
                    const isUserChoice = userVote?.optionIndex === i;
                    return (
                        <button
                            key={i}
                            onClick={() => !hasVoted && handleVote(i)}
                            disabled={voting || hasVoted}
                            className="w-full text-left rounded-2xl border overflow-hidden transition-all relative"
                            style={{
                                background: isUserChoice
                                    ? "#EDF2E8"
                                    : hasVoted
                                      ? "#F8F5EE"
                                      : "#FFFDF8",
                                borderColor: isUserChoice
                                    ? "#556B2F"
                                    : "#D6D3C9",
                                cursor: hasVoted ? "default" : "pointer",
                            }}
                        >
                            {/* progress fill */}
                            {hasVoted && (
                                <div
                                    className="absolute inset-0 rounded-2xl"
                                    style={{
                                        width: `${pct}%`,
                                        background: isUserChoice
                                            ? "rgba(85,107,47,0.1)"
                                            : "rgba(214,211,201,0.4)",
                                        transition:
                                            "width 0.7s cubic-bezier(0.34,1.56,0.64,1)",
                                    }}
                                />
                            )}
                            <div className="relative flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-2">
                                    {isUserChoice && (
                                        <CheckCircle2
                                            size={15}
                                            style={{ color: "#556B2F" }}
                                        />
                                    )}
                                    <span
                                        className="text-sm font-semibold"
                                        style={{
                                            color: isUserChoice
                                                ? "#556B2F"
                                                : "#1F2937",
                                        }}
                                    >
                                        {option.text}
                                    </span>
                                </div>
                                {hasVoted && (
                                    <span
                                        className="text-sm font-bold"
                                        style={{
                                            color: isUserChoice
                                                ? "#556B2F"
                                                : "#6B7280",
                                        }}
                                    >
                                        {pct}%
                                    </span>
                                )}
                                {voting && !hasVoted && (
                                    <Loader2
                                        size={14}
                                        className="animate-spin"
                                        style={{ color: "#6B7280" }}
                                    />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Analytics toggle */}
            {hasVoted && votes.length > 0 && (
                <div className="px-4 pb-4">
                    <button
                        onClick={() => setShowAnalytics(!showAnalytics)}
                        className="w-full py-2.5 rounded-2xl text-sm font-semibold border transition-all"
                        style={{
                            borderColor: "#556B2F",
                            color: "#556B2F",
                            background: showAnalytics
                                ? "#EDF2E8"
                                : "transparent",
                        }}
                    >
                        {showAnalytics
                            ? "Hide Analytics"
                            : "📊 View Demographics"}
                    </button>
                    {showAnalytics && (
                        <div className="mt-4 fade-in">
                            <h3
                                className="font-bold text-sm mb-3"
                                style={{ color: "#1F2937" }}
                            >
                                Vote Breakdown
                            </h3>
                            <DemoChart
                                votes={votes}
                                field="gender"
                                title="By Gender"
                            />
                            <DemoChart
                                votes={votes}
                                field="age"
                                title="By Age Group"
                            />
                            <DemoChart
                                votes={votes}
                                field="stateOfOrigin"
                                title="By State of Origin"
                            />
                            <DemoChart
                                votes={votes}
                                field="campLocation"
                                title="By Camp"
                            />
                            <DemoChart
                                votes={votes}
                                field="religion"
                                title="By Religion"
                            />
                            <DemoChart
                                votes={votes}
                                field="institutionType"
                                title="By Institution Type"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
