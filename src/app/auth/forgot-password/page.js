"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { resetPassword } from "@/lib/auth";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleReset = useCallback(
        async (e) => {
            e.preventDefault();
            if (!email) return toast.error("Enter your email");
            setLoading(true);
            try {
                await resetPassword(email);
                setSent(true);
            } catch {
                toast.error("Failed to send reset email");
            } finally {
                setLoading(false);
            }
        },
        [email],
    );

    const focusBorder = useCallback((e) => {
        e.target.style.borderColor = "#556B2F";
    }, []);
    const blurBorder = useCallback((e) => {
        e.target.style.borderColor = "#D6D3C9";
    }, []);

    return (
        <div
            className="min-h-screen flex flex-col justify-center px-5 py-10"
            style={{ background: "#F8F5EE" }}
        >
            <div className="max-w-sm mx-auto w-full">
                <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 text-sm font-semibold mb-8"
                    style={{ color: "#6B7280" }}
                >
                    <ArrowLeft size={16} aria-hidden="true" /> Back to login
                </Link>

                {sent ? (
                    <div className="text-center">
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                            style={{ background: "#D1FAE5" }}
                        >
                            <CheckCircle2
                                size={32}
                                style={{ color: "#10B981" }}
                                aria-hidden="true"
                            />
                        </div>
                        <h1
                            className="font-display font-bold text-2xl mb-2"
                            style={{ color: "#1F2937" }}
                        >
                            Check your inbox!
                        </h1>
                        <p className="text-sm" style={{ color: "#6B7280" }}>
                            We sent a password reset link to{" "}
                            <strong>{email}</strong>
                        </p>
                        <Link
                            href="/auth/login"
                            className="mt-6 block w-full py-3.5 rounded-2xl font-bold text-sm text-white text-center"
                            style={{
                                background:
                                    "linear-gradient(135deg, #556B2F, #3E5F44)",
                            }}
                        >
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <>
                        <h1
                            className="font-display font-bold text-3xl mb-2"
                            style={{ color: "#1F2937" }}
                        >
                            Reset Password
                        </h1>
                        <p
                            className="text-sm mb-8"
                            style={{ color: "#6B7280" }}
                        >
                            We&apos;ll send a reset link to your email
                        </p>
                        <form
                            onSubmit={handleReset}
                            className="flex flex-col gap-4"
                        >
                            <div>
                                <label
                                    className="text-xs font-semibold mb-1.5 block"
                                    style={{ color: "#6B7280" }}
                                    htmlFor="reset-email"
                                >
                                    Email address
                                </label>
                                <div className="relative">
                                    <Mail
                                        size={16}
                                        className="absolute left-4 top-1/2 -translate-y-1/2"
                                        style={{ color: "#6B7280" }}
                                        aria-hidden="true"
                                    />
                                    <input
                                        id="reset-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        placeholder="you@example.com"
                                        autoComplete="email"
                                        className="w-full pl-11 pr-4 py-3 rounded-2xl border text-sm outline-none transition-all"
                                        style={{
                                            borderColor: "#D6D3C9",
                                            background: "#FFFDF8",
                                            color: "#1F2937",
                                            fontFamily:
                                                "'Plus Jakarta Sans', sans-serif",
                                        }}
                                        onFocus={focusBorder}
                                        onBlur={blurBorder}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #556B2F, #3E5F44)",
                                    boxShadow: "0 4px 16px rgba(85,107,47,0.3)",
                                }}
                            >
                                {loading ? (
                                    <Loader2
                                        size={18}
                                        className="animate-spin"
                                    />
                                ) : (
                                    "Send Reset Link"
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
