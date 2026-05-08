"use client";
import { useState, useRef, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Camera, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createUserProfile } from "@/lib/auth";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import toast from "react-hot-toast";
import Image from "next/image";

const STATES = [
    "Abia",
    "Adamawa",
    "Akwa Ibom",
    "Anambra",
    "Bauchi",
    "Bayelsa",
    "Benue",
    "Borno",
    "Cross River",
    "Delta",
    "Ebonyi",
    "Edo",
    "Ekiti",
    "Enugu",
    "FCT",
    "Gombe",
    "Imo",
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Kogi",
    "Kwara",
    "Lagos",
    "Nasarawa",
    "Niger",
    "Ogun",
    "Ondo",
    "Osun",
    "Oyo",
    "Plateau",
    "Rivers",
    "Sokoto",
    "Taraba",
    "Yobe",
    "Zamfara",
];
const CAMPS = [
    "Kubwa Camp (FCT)",
    "Sagamu Camp (Ogun)",
    "Iyana-Ipaja Camp (Lagos)",
    "Ede Camp (Osun)",
    "Awgu Camp (Enugu)",
    "Nasarawa Camp",
    "Port Harcourt Camp (Rivers)",
    "Kano State Camp",
    "Ibadan Camp (Oyo)",
    "Benin Camp (Edo)",
    "Calabar Camp (Cross River)",
    "Other",
];
const INSTITUTION_TYPES = [
    "Federal University",
    "State University",
    "Private University",
    "Polytechnic",
    "College of Education",
    "Other",
];
const STEPS = [
    { num: 1, label: "Your Details", emoji: "👤" },
    { num: 2, label: "Camp Info", emoji: "⛺" },
    { num: 3, label: "Your Vibe", emoji: "✨" },
];

const inputClass =
    "w-full px-4 py-3 rounded-2xl border text-sm outline-none transition-all";
const inputStyle = {
    borderColor: "#D6D3C9",
    background: "#FFFDF8",
    color: "#1F2937",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
};
const labelStyle = { color: "#6B7280" };

// Stable shared focus/blur handlers
const handleFocus = (e) => {
    e.target.style.borderColor = "#556B2F";
};
const handleBlur = (e) => {
    e.target.style.borderColor = "#D6D3C9";
};

const StepIndicator = memo(function StepIndicator({ step }) {
    return (
        <div className="flex items-center justify-between mb-6">
            {STEPS.map((s, i) => (
                <div key={s.num} className="flex items-center gap-2 flex-1">
                    <div className="flex flex-col items-center gap-1">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all"
                            style={{
                                background:
                                    step > s.num
                                        ? "#10B981"
                                        : step === s.num
                                          ? "#556B2F"
                                          : "#D6D3C9",
                                color: step >= s.num ? "white" : "#6B7280",
                            }}
                        >
                            {step > s.num ? <Check size={16} /> : s.emoji}
                        </div>
                        <span
                            className="text-[10px] font-semibold"
                            style={{
                                color: step === s.num ? "#556B2F" : "#6B7280",
                            }}
                        >
                            {s.label}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div
                            className="flex-1 h-0.5 mx-1 mb-4"
                            style={{
                                background:
                                    step > s.num ? "#10B981" : "#D6D3C9",
                            }}
                        />
                    )}
                </div>
            ))}
        </div>
    );
});

export default function OnboardingPage() {
    const { user, refreshProfile } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const fileRef = useRef();

    const [form, setForm] = useState({
        displayName: "",
        age: "",
        gender: "",
        religion: "",
        stateOfOrigin: "",
        campLocation: "",
        institutionType: "",
        platoonNumber: "",
        bio: "",
    });

    const update = useCallback(
        (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value })),
        [],
    );

    const handleAvatarChange = useCallback((e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAvatarFile(file);
        // Revoke previous preview URL to avoid memory leak
        setAvatarPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
        });
    }, []);

    const handleFinish = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            let photoURL = user.photoURL || null;
            if (avatarFile) {
                const storageRef = ref(storage, `avatars/${user.uid}`);
                await uploadBytes(storageRef, avatarFile);
                photoURL = await getDownloadURL(storageRef);
            }
            await createUserProfile(user.uid, {
                uid: user.uid,
                displayName: form.displayName || user.displayName,
                email: user.email,
                photoURL,
                bio: form.bio,
                age: Number(form.age),
                gender: form.gender,
                religion: form.religion,
                stateOfOrigin: form.stateOfOrigin,
                campLocation: form.campLocation,
                institutionType: form.institutionType,
                platoonNumber: form.platoonNumber,
                onboardingComplete: true,
            });
            await refreshProfile(user.uid);
            toast.success("Welcome to Camp Connect! 🎉");
            router.push("/");
        } catch {
            toast.error("Failed to save profile");
        } finally {
            setLoading(false);
        }
    }, [user, avatarFile, form, refreshProfile, router]);

    const handleNext = useCallback(async () => {
        if (step === 1) {
            if (!form.displayName || !form.age || !form.gender)
                return toast.error("Fill required fields");
            setStep(2);
        } else if (step === 2) {
            if (
                !form.stateOfOrigin ||
                !form.campLocation ||
                !form.platoonNumber
            )
                return toast.error("Fill required fields");
            setStep(3);
        } else {
            await handleFinish();
        }
    }, [step, form, handleFinish]);

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{ background: "#F8F5EE" }}
        >
            <div
                className="sticky top-0 z-10 px-5 pt-10 pb-6"
                style={{ background: "#F8F5EE" }}
            >
                <div className="max-w-sm mx-auto">
                    <StepIndicator step={step} />
                </div>
            </div>

            <div className="flex-1 px-5 pb-32 overflow-y-auto">
                <div className="max-w-sm mx-auto">
                    {step === 1 && (
                        <div className="fade-in flex flex-col gap-4">
                            <div className="mb-2">
                                <h2
                                    className="font-display font-bold text-2xl"
                                    style={{ color: "#1F2937" }}
                                >
                                    Tell us about you
                                </h2>
                                <p
                                    className="text-sm mt-1"
                                    style={{ color: "#6B7280" }}
                                >
                                    Basic info to get you set up
                                </p>
                            </div>
                            {[
                                {
                                    key: "displayName",
                                    label: "Full Name *",
                                    placeholder: "Amaka Okonkwo",
                                    type: "text",
                                },
                                {
                                    key: "age",
                                    label: "Age *",
                                    placeholder: "22",
                                    type: "number",
                                    min: "18",
                                    max: "35",
                                },
                            ].map(
                                ({
                                    key,
                                    label,
                                    placeholder,
                                    type,
                                    min,
                                    max,
                                }) => (
                                    <div key={key}>
                                        <label
                                            className="text-xs font-semibold mb-1.5 block"
                                            style={labelStyle}
                                            htmlFor={`ob-${key}`}
                                        >
                                            {label}
                                        </label>
                                        <input
                                            id={`ob-${key}`}
                                            type={type}
                                            value={form[key]}
                                            onChange={update(key)}
                                            placeholder={placeholder}
                                            min={min}
                                            max={max}
                                            className={inputClass}
                                            style={inputStyle}
                                            onFocus={handleFocus}
                                            onBlur={handleBlur}
                                        />
                                    </div>
                                ),
                            )}
                            {[
                                {
                                    key: "gender",
                                    label: "Gender *",
                                    options: [
                                        "Male",
                                        "Female",
                                        "Prefer not to say",
                                    ],
                                },
                                {
                                    key: "religion",
                                    label: "Religion",
                                    options: [
                                        "Christianity",
                                        "Islam",
                                        "Traditional",
                                        "Other",
                                        "Prefer not to say",
                                    ],
                                },
                            ].map(({ key, label, options }) => (
                                <div key={key}>
                                    <label
                                        className="text-xs font-semibold mb-1.5 block"
                                        style={labelStyle}
                                        htmlFor={`ob-${key}`}
                                    >
                                        {label}
                                    </label>
                                    <select
                                        id={`ob-${key}`}
                                        value={form[key]}
                                        onChange={update(key)}
                                        className={inputClass}
                                        style={inputStyle}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                    >
                                        <option value="">Select {key}</option>
                                        {options.map((o) => (
                                            <option key={o}>{o}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="fade-in flex flex-col gap-4">
                            <div className="mb-2">
                                <h2
                                    className="font-display font-bold text-2xl"
                                    style={{ color: "#1F2937" }}
                                >
                                    Your Camp Info
                                </h2>
                                <p
                                    className="text-sm mt-1"
                                    style={{ color: "#6B7280" }}
                                >
                                    Help us connect you with your platoon
                                </p>
                            </div>
                            <div>
                                <label
                                    className="text-xs font-semibold mb-1.5 block"
                                    style={labelStyle}
                                    htmlFor="ob-state"
                                >
                                    State of Origin *
                                </label>
                                <select
                                    id="ob-state"
                                    value={form.stateOfOrigin}
                                    onChange={update("stateOfOrigin")}
                                    className={inputClass}
                                    style={inputStyle}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                >
                                    <option value="">Select state</option>
                                    {STATES.map((s) => (
                                        <option key={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label
                                    className="text-xs font-semibold mb-1.5 block"
                                    style={labelStyle}
                                    htmlFor="ob-camp"
                                >
                                    Camp Location *
                                </label>
                                <select
                                    id="ob-camp"
                                    value={form.campLocation}
                                    onChange={update("campLocation")}
                                    className={inputClass}
                                    style={inputStyle}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                >
                                    <option value="">Select camp</option>
                                    {CAMPS.map((c) => (
                                        <option key={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label
                                    className="text-xs font-semibold mb-1.5 block"
                                    style={labelStyle}
                                    htmlFor="ob-inst"
                                >
                                    Institution Type
                                </label>
                                <select
                                    id="ob-inst"
                                    value={form.institutionType}
                                    onChange={update("institutionType")}
                                    className={inputClass}
                                    style={inputStyle}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                >
                                    <option value="">Select type</option>
                                    {INSTITUTION_TYPES.map((t) => (
                                        <option key={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label
                                    className="text-xs font-semibold mb-1.5 block"
                                    style={labelStyle}
                                    htmlFor="ob-platoon"
                                >
                                    Platoon Number *
                                </label>
                                <input
                                    id="ob-platoon"
                                    type="number"
                                    value={form.platoonNumber}
                                    onChange={update("platoonNumber")}
                                    placeholder="e.g. 7"
                                    min="1"
                                    max="30"
                                    className={inputClass}
                                    style={inputStyle}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="fade-in flex flex-col gap-5">
                            <div className="mb-2">
                                <h2
                                    className="font-display font-bold text-2xl"
                                    style={{ color: "#1F2937" }}
                                >
                                    Your Profile Vibe
                                </h2>
                                <p
                                    className="text-sm mt-1"
                                    style={{ color: "#6B7280" }}
                                >
                                    Almost done! Add a photo and bio
                                </p>
                            </div>
                            <div className="flex flex-col items-center gap-3">
                                <div
                                    className="w-24 h-24 rounded-3xl overflow-hidden border-2 cursor-pointer relative flex items-center justify-center"
                                    style={{
                                        borderColor: "#D6D3C9",
                                        background: "#F3F0E8",
                                    }}
                                    onClick={() => fileRef.current?.click()}
                                    role="button"
                                    aria-label="Upload profile photo"
                                    tabIndex={0}
                                >
                                    {avatarPreview ? (
                                        <Image
                                            src={avatarPreview}
                                            alt="Preview"
                                            width={96}
                                            height={96}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-1 text-center">
                                            <Camera
                                                size={24}
                                                style={{ color: "#6B7280" }}
                                                aria-hidden="true"
                                            />
                                            <span
                                                className="text-xs font-medium"
                                                style={{ color: "#6B7280" }}
                                            >
                                                Add photo
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                    aria-label="Upload photo"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    className="text-sm font-semibold"
                                    style={{ color: "#556B2F" }}
                                >
                                    {avatarPreview
                                        ? "Change photo"
                                        : "Upload profile photo"}
                                </button>
                            </div>
                            <div>
                                <label
                                    className="text-xs font-semibold mb-1.5 block"
                                    style={labelStyle}
                                    htmlFor="ob-bio"
                                >
                                    Bio (optional)
                                </label>
                                <textarea
                                    id="ob-bio"
                                    value={form.bio}
                                    onChange={update("bio")}
                                    rows={3}
                                    placeholder="Tell the camp fam about yourself... 🙌"
                                    className="w-full px-4 py-3 rounded-2xl border text-sm outline-none transition-all resize-none"
                                    style={inputStyle}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                    maxLength={160}
                                />
                                <div
                                    className="text-right text-xs mt-1"
                                    style={{ color: "#6B7280" }}
                                >
                                    {form.bio.length}/160
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div
                className="fixed bottom-0 left-0 right-0 px-5 py-5"
                style={{
                    background: "rgba(248,245,238,0.95)",
                    backdropFilter: "blur(12px)",
                    borderTop: "1px solid #D6D3C9",
                }}
            >
                <div className="max-w-sm mx-auto flex gap-3">
                    {step > 1 && (
                        <button
                            onClick={() => setStep((s) => s - 1)}
                            className="flex-none px-6 py-3.5 rounded-2xl font-semibold text-sm border"
                            style={{ borderColor: "#D6D3C9", color: "#6B7280" }}
                        >
                            Back
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        disabled={loading}
                        className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95"
                        style={{
                            background:
                                "linear-gradient(135deg, #556B2F, #3E5F44)",
                            boxShadow: "0 4px 16px rgba(85,107,47,0.3)",
                        }}
                    >
                        {loading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : step === 3 ? (
                            "🎉 Enter Camp!"
                        ) : (
                            "Continue →"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
