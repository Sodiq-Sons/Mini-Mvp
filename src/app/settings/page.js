"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Camera,
    Save,
    LogOut,
    Shield,
    Bell,
    Lock,
    Trash2,
    ChevronRight,
    Loader2,
    CheckCircle2,
    User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/lib/firestore";
import { logOut } from "@/lib/auth";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Avatar from "@/components/shared/Avatar";
import toast from "react-hot-toast";

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

function SettingsRow({
    icon: Icon,
    label,
    sublabel,
    rightEl,
    onClick,
    danger,
}) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all active:scale-95"
            style={{ background: "#FFFDF8", borderColor: "#D6D3C9" }}
        >
            <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: danger ? "#FEE2E2" : "#EDF2E8" }}
            >
                <Icon
                    size={17}
                    style={{ color: danger ? "#EF4444" : "#556B2F" }}
                />
            </div>
            <div className="flex-1 min-w-0">
                <p
                    className="text-sm font-semibold"
                    style={{ color: danger ? "#EF4444" : "#1F2937" }}
                >
                    {label}
                </p>
                {sublabel && (
                    <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                        {sublabel}
                    </p>
                )}
            </div>
            {rightEl || <ChevronRight size={16} style={{ color: "#D6D3C9" }} />}
        </button>
    );
}

export default function SettingsPage() {
    const { user, profile, refreshProfile } = useAuth();
    const router = useRouter();
    const fileRef = useRef();
    const [saving, setSaving] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [section, setSection] = useState("main"); // main | profile | account

    const [form, setForm] = useState({
        displayName: profile?.displayName || "",
        bio: profile?.bio || "",
        campLocation: profile?.campLocation || "",
        stateOfOrigin: profile?.stateOfOrigin || "",
        platoonNumber: profile?.platoonNumber || "",
        institutionType: profile?.institutionType || "",
    });

    const update = (k) => (e) =>
        setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024)
            return toast.error("Image must be under 5MB");
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            let photoURL = profile?.photoURL;
            if (avatarFile) {
                const storRef = ref(storage, `avatars/${user.uid}`);
                await uploadBytes(storRef, avatarFile);
                photoURL = await getDownloadURL(storRef);
            }
            await updateUserProfile(user.uid, {
                ...form,
                photoURL,
                platoonNumber: form.platoonNumber
                    ? Number(form.platoonNumber)
                    : null,
            });
            await refreshProfile(user.uid);
            toast.success("Profile updated! ✅");
            setSection("main");
        } catch {
            toast.error("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await logOut();
        router.replace("/auth/login");
        toast.success("Logged out. See you around! 👋");
    };

    const inputStyle = {
        borderColor: "#D6D3C9",
        background: "#FFFDF8",
        color: "#1F2937",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
    };

    if (!profile) return null;

    return (
        <div className="min-h-screen" style={{ background: "#F8F5EE" }}>
            {/* Header */}
            <header
                className="sticky top-0 z-40 border-b flex items-center h-14 px-4 gap-3"
                style={{
                    background: "rgba(255,253,248,0.92)",
                    backdropFilter: "blur(12px)",
                    borderColor: "#D6D3C9",
                }}
            >
                {section !== "main" ? (
                    <button
                        onClick={() => setSection("main")}
                        className="p-2 -ml-2 rounded-xl"
                    >
                        <ArrowLeft size={20} style={{ color: "#1F2937" }} />
                    </button>
                ) : (
                    <Link
                        href={`/profile/${user?.uid}`}
                        className="p-2 -ml-2 rounded-xl"
                    >
                        <ArrowLeft size={20} style={{ color: "#1F2937" }} />
                    </Link>
                )}
                <h1
                    className="font-display font-bold text-lg flex-1"
                    style={{ color: "#1F2937" }}
                >
                    {section === "main"
                        ? "Settings"
                        : section === "profile"
                          ? "Edit Profile"
                          : "Account"}
                </h1>
                {section === "profile" && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm text-white"
                        style={{ background: "#556B2F" }}
                    >
                        {saving ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <>
                                <Save size={14} />
                                Save
                            </>
                        )}
                    </button>
                )}
            </header>

            <div className="max-w-lg mx-auto px-4 py-4 pb-20">
                {/* MAIN SETTINGS */}
                {section === "main" && (
                    <div className="flex flex-col gap-3">
                        {/* Profile card */}
                        <Link href={`/profile/${user?.uid}`}>
                            <div
                                className="flex items-center gap-3 p-4 rounded-2xl border"
                                style={{
                                    background: "#FFFDF8",
                                    borderColor: "#D6D3C9",
                                }}
                            >
                                <Avatar
                                    src={profile.photoURL}
                                    name={profile.displayName}
                                    size={52}
                                />
                                <div className="flex-1 min-w-0">
                                    <p
                                        className="font-bold"
                                        style={{ color: "#1F2937" }}
                                    >
                                        {profile.displayName}
                                    </p>
                                    <p
                                        className="text-sm truncate"
                                        style={{ color: "#6B7280" }}
                                    >
                                        {profile.email}
                                    </p>
                                    {profile.campLocation && (
                                        <p
                                            className="text-xs mt-0.5"
                                            style={{ color: "#556B2F" }}
                                        >
                                            ⛺ {profile.campLocation}
                                        </p>
                                    )}
                                </div>
                                <ChevronRight
                                    size={16}
                                    style={{ color: "#D6D3C9" }}
                                />
                            </div>
                        </Link>

                        <div className="mt-2">
                            <p
                                className="text-xs font-bold mb-2 uppercase tracking-wider px-1"
                                style={{ color: "#6B7280" }}
                            >
                                Profile
                            </p>
                            <div className="flex flex-col gap-2">
                                <SettingsRow
                                    icon={User}
                                    label="Edit Profile"
                                    sublabel="Update your info, photo & bio"
                                    onClick={() => setSection("profile")}
                                />
                            </div>
                        </div>

                        <div className="mt-2">
                            <p
                                className="text-xs font-bold mb-2 uppercase tracking-wider px-1"
                                style={{ color: "#6B7280" }}
                            >
                                Account
                            </p>
                            <div className="flex flex-col gap-2">
                                <SettingsRow
                                    icon={Shield}
                                    label="Verification"
                                    sublabel={
                                        profile.verified
                                            ? "Verified corps member ✅"
                                            : "Not verified yet"
                                    }
                                    onClick={() =>
                                        toast("Verification coming soon! 🚀")
                                    }
                                />
                                <SettingsRow
                                    icon={Bell}
                                    label="Notifications"
                                    sublabel="Manage notification preferences"
                                    onClick={() => toast("Coming soon!")}
                                />
                                <SettingsRow
                                    icon={Lock}
                                    label="Privacy & Security"
                                    sublabel="Password, data & privacy"
                                    onClick={() => toast("Coming soon!")}
                                />
                            </div>
                        </div>

                        <div className="mt-2">
                            <p
                                className="text-xs font-bold mb-2 uppercase tracking-wider px-1"
                                style={{ color: "#6B7280" }}
                            >
                                About
                            </p>
                            <div
                                className="p-4 rounded-2xl border"
                                style={{
                                    background: "#FFFDF8",
                                    borderColor: "#D6D3C9",
                                }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div
                                        className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
                                        style={{ background: "#556B2F" }}
                                    >
                                        ⛺
                                    </div>
                                    <div>
                                        <p
                                            className="font-bold text-sm"
                                            style={{ color: "#1F2937" }}
                                        >
                                            Camp Connect
                                        </p>
                                        <p
                                            className="text-xs"
                                            style={{ color: "#6B7280" }}
                                        >
                                            Version 1.0.0
                                        </p>
                                    </div>
                                </div>
                                <p
                                    className="text-xs"
                                    style={{ color: "#6B7280" }}
                                >
                                    The social hub for NYSC corps members across
                                    Nigeria 🇳🇬
                                </p>
                            </div>
                        </div>

                        <div className="mt-2">
                            <SettingsRow
                                icon={LogOut}
                                label="Log Out"
                                sublabel="Sign out of your account"
                                onClick={handleLogout}
                                danger
                            />
                        </div>
                    </div>
                )}

                {/* PROFILE EDIT */}
                {section === "profile" && (
                    <div className="flex flex-col gap-4">
                        {/* Avatar */}
                        <div className="flex flex-col items-center gap-3 py-4">
                            <div
                                className="relative cursor-pointer"
                                onClick={() => fileRef.current?.click()}
                            >
                                <Avatar
                                    src={avatarPreview || profile.photoURL}
                                    name={profile.displayName}
                                    size={80}
                                    className="border-4"
                                />
                                <div
                                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white"
                                    style={{ background: "#556B2F" }}
                                >
                                    <Camera size={13} color="white" />
                                </div>
                            </div>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                            <button
                                onClick={() => fileRef.current?.click()}
                                className="text-sm font-semibold"
                                style={{ color: "#556B2F" }}
                            >
                                Change photo
                            </button>
                        </div>

                        {[
                            {
                                key: "displayName",
                                label: "Display Name",
                                placeholder: "Your name",
                            },
                            {
                                key: "bio",
                                label: "Bio",
                                placeholder:
                                    "Tell the camp fam about yourself...",
                                textarea: true,
                            },
                            {
                                key: "platoonNumber",
                                label: "Platoon Number",
                                placeholder: "7",
                                type: "number",
                            },
                        ].map(({ key, label, placeholder, textarea, type }) => (
                            <div key={key}>
                                <label
                                    className="text-xs font-semibold mb-1.5 block"
                                    style={{ color: "#6B7280" }}
                                >
                                    {label}
                                </label>
                                {textarea ? (
                                    <textarea
                                        value={form[key]}
                                        onChange={update(key)}
                                        rows={3}
                                        placeholder={placeholder}
                                        maxLength={160}
                                        className="w-full px-4 py-3 rounded-2xl border text-sm outline-none transition-all resize-none"
                                        style={inputStyle}
                                        onFocus={(e) =>
                                            (e.target.style.borderColor =
                                                "#556B2F")
                                        }
                                        onBlur={(e) =>
                                            (e.target.style.borderColor =
                                                "#D6D3C9")
                                        }
                                    />
                                ) : (
                                    <input
                                        type={type || "text"}
                                        value={form[key]}
                                        onChange={update(key)}
                                        placeholder={placeholder}
                                        className="w-full px-4 py-3 rounded-2xl border text-sm outline-none transition-all"
                                        style={inputStyle}
                                        onFocus={(e) =>
                                            (e.target.style.borderColor =
                                                "#556B2F")
                                        }
                                        onBlur={(e) =>
                                            (e.target.style.borderColor =
                                                "#D6D3C9")
                                        }
                                    />
                                )}
                            </div>
                        ))}

                        <div>
                            <label
                                className="text-xs font-semibold mb-1.5 block"
                                style={{ color: "#6B7280" }}
                            >
                                State of Origin
                            </label>
                            <select
                                value={form.stateOfOrigin}
                                onChange={update("stateOfOrigin")}
                                className="w-full px-4 py-3 rounded-2xl border text-sm outline-none"
                                style={inputStyle}
                                onFocus={(e) =>
                                    (e.target.style.borderColor = "#556B2F")
                                }
                                onBlur={(e) =>
                                    (e.target.style.borderColor = "#D6D3C9")
                                }
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
                                style={{ color: "#6B7280" }}
                            >
                                Camp Location
                            </label>
                            <select
                                value={form.campLocation}
                                onChange={update("campLocation")}
                                className="w-full px-4 py-3 rounded-2xl border text-sm outline-none"
                                style={inputStyle}
                                onFocus={(e) =>
                                    (e.target.style.borderColor = "#556B2F")
                                }
                                onBlur={(e) =>
                                    (e.target.style.borderColor = "#D6D3C9")
                                }
                            >
                                <option value="">Select camp</option>
                                {CAMPS.map((c) => (
                                    <option key={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
