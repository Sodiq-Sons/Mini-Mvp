"use client";
import { useState, useCallback, memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { signUp, signInWithGoogle, createUserProfile } from "@/lib/auth";
import toast from "react-hot-toast";

const GoogleIcon = memo(function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
        </svg>
    );
});

const inputBaseStyle = {
    borderColor: "#D6D3C9",
    background: "#FFFDF8",
    color: "#1F2937",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
};

export default function SignupPage() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirm: "",
    });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const router = useRouter();

    const update = useCallback(
        (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value })),
        [],
    );
    const focusBorder = useCallback((e) => {
        e.target.style.borderColor = "#556B2F";
    }, []);
    const blurBorder = useCallback((e) => {
        e.target.style.borderColor = "#D6D3C9";
    }, []);

    const handleSignup = useCallback(
        async (e) => {
            e.preventDefault();
            if (!form.name || !form.email || !form.password)
                return toast.error("Fill in all fields");
            if (form.password !== form.confirm)
                return toast.error("Passwords do not match");
            if (form.password.length < 6)
                return toast.error("Password must be at least 6 characters");
            setLoading(true);
            try {
                const user = await signUp(form.email, form.password, form.name);
                await createUserProfile(user.uid, {
                    uid: user.uid,
                    displayName: form.name,
                    email: form.email,
                    photoURL: null,
                    onboardingComplete: false,
                    onboardingStep: 2,
                });
                toast.success("Account created! 🎉");
                router.push("/auth/onboarding");
            } catch (err) {
                const msg =
                    err.code === "auth/email-already-in-use"
                        ? "Email already registered"
                        : err.code === "unavailable"
                          ? "Network error. Please try again."
                          : "Signup failed. Try again.";
                toast.error(msg);
            } finally {
                setLoading(false);
            }
        },
        [form, router],
    );

    const handleGoogle = useCallback(async () => {
        setGoogleLoading(true);
        try {
            const user = await signInWithGoogle();
            await createUserProfile(user.uid, {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                onboardingComplete: false,
                onboardingStep: 2,
            });
            router.push("/auth/onboarding");
        } catch {
            toast.error("Google sign-up failed");
        } finally {
            setGoogleLoading(false);
        }
    }, [router]);

    return (
        <div
            className="min-h-screen flex flex-col justify-center px-5 py-10"
            style={{ background: "#F8F5EE" }}
        >
            <div className="max-w-sm mx-auto w-full">
                <div className="text-center mb-8">
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg"
                        style={{
                            background:
                                "linear-gradient(135deg, #556B2F, #3E5F44)",
                        }}
                    >
                        ⛺
                    </div>
                    <h1
                        className="font-display font-bold text-3xl"
                        style={{ color: "#1F2937" }}
                    >
                        Join Camp Connect
                    </h1>
                    <p className="mt-2 text-sm" style={{ color: "#6B7280" }}>
                        Connect with corps members nationwide 🇳🇬
                    </p>
                </div>

                <button
                    onClick={handleGoogle}
                    disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border font-semibold text-sm transition-all hover:shadow-md active:scale-95 mb-6"
                    style={{
                        borderColor: "#D6D3C9",
                        background: "#FFFDF8",
                        color: "#1F2937",
                    }}
                >
                    {googleLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <GoogleIcon />
                    )}
                    Sign up with Google
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div
                        className="flex-1 h-px"
                        style={{ background: "#D6D3C9" }}
                    />
                    <span
                        className="text-xs font-medium"
                        style={{ color: "#6B7280" }}
                    >
                        or with email
                    </span>
                    <div
                        className="flex-1 h-px"
                        style={{ background: "#D6D3C9" }}
                    />
                </div>

                <form onSubmit={handleSignup} className="flex flex-col gap-4">
                    {[
                        {
                            key: "name",
                            Icon: User,
                            label: "Full Name",
                            type: "text",
                            placeholder: "Amaka Okonkwo",
                            autoComplete: "name",
                        },
                        {
                            key: "email",
                            Icon: Mail,
                            label: "Email Address",
                            type: "email",
                            placeholder: "you@example.com",
                            autoComplete: "email",
                        },
                    ].map(
                        ({
                            key,
                            Icon,
                            label,
                            type,
                            placeholder,
                            autoComplete,
                        }) => (
                            <div key={key}>
                                <label
                                    className="text-xs font-semibold mb-1.5 block"
                                    style={{ color: "#6B7280" }}
                                    htmlFor={`signup-${key}`}
                                >
                                    {label}
                                </label>
                                <div className="relative">
                                    <Icon
                                        size={16}
                                        className="absolute left-4 top-1/2 -translate-y-1/2"
                                        style={{ color: "#6B7280" }}
                                        aria-hidden="true"
                                    />
                                    <input
                                        id={`signup-${key}`}
                                        type={type}
                                        value={form[key]}
                                        onChange={update(key)}
                                        placeholder={placeholder}
                                        autoComplete={autoComplete}
                                        className="w-full pl-11 pr-4 py-3 rounded-2xl border text-sm outline-none transition-all"
                                        style={inputBaseStyle}
                                        onFocus={focusBorder}
                                        onBlur={blurBorder}
                                    />
                                </div>
                            </div>
                        ),
                    )}

                    {["password", "confirm"].map((k) => (
                        <div key={k}>
                            <label
                                className="text-xs font-semibold mb-1.5 block"
                                style={{ color: "#6B7280" }}
                                htmlFor={`signup-${k}`}
                            >
                                {k === "password"
                                    ? "Password"
                                    : "Confirm Password"}
                            </label>
                            <div className="relative">
                                <Lock
                                    size={16}
                                    className="absolute left-4 top-1/2 -translate-y-1/2"
                                    style={{ color: "#6B7280" }}
                                    aria-hidden="true"
                                />
                                <input
                                    id={`signup-${k}`}
                                    type={showPw ? "text" : "password"}
                                    value={form[k]}
                                    onChange={update(k)}
                                    placeholder="••••••••"
                                    autoComplete={
                                        k === "password"
                                            ? "new-password"
                                            : "new-password"
                                    }
                                    className="w-full pl-11 pr-11 py-3 rounded-2xl border text-sm outline-none transition-all"
                                    style={inputBaseStyle}
                                    onFocus={focusBorder}
                                    onBlur={blurBorder}
                                />
                                {k === "password" && (
                                    <button
                                        type="button"
                                        className="absolute right-4 top-1/2 -translate-y-1/2"
                                        onClick={() => setShowPw((p) => !p)}
                                        aria-label={
                                            showPw
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                    >
                                        {showPw ? (
                                            <EyeOff
                                                size={16}
                                                style={{ color: "#6B7280" }}
                                            />
                                        ) : (
                                            <Eye
                                                size={16}
                                                style={{ color: "#6B7280" }}
                                            />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95 mt-2"
                        style={{
                            background:
                                "linear-gradient(135deg, #556B2F, #3E5F44)",
                            boxShadow: "0 4px 16px rgba(85,107,47,0.3)",
                        }}
                    >
                        {loading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            "Create Account 🚀"
                        )}
                    </button>
                </form>

                <p
                    className="text-center text-sm mt-6"
                    style={{ color: "#6B7280" }}
                >
                    Already a member?{" "}
                    <Link
                        href="/auth/login"
                        className="font-bold"
                        style={{ color: "#556B2F" }}
                    >
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}
