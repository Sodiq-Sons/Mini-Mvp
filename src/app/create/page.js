"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    X,
    Image,
    BarChart2,
    Plus,
    Trash2,
    Loader2,
    ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createPost, createPoll } from "@/lib/firestore";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import toast from "react-hot-toast";
import Link from "next/link";

const CATEGORIES = ["gist", "food", "issues", "story", "poll", "general"];
const POLL_TYPES = [
    { key: "yesno", label: "Yes / No", desc: "Simple two-option vote" },
    {
        key: "scale",
        label: "Agreement Scale",
        desc: "Strongly Agree → Strongly Disagree",
    },
    { key: "custom", label: "Custom Options", desc: "Add your own options" },
];

export default function CreatePage() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({
        title: "",
        description: "",
        category: "gist",
    });
    const [postType, setPostType] = useState("text"); // text | image | poll
    const [pollType, setPollType] = useState("yesno");
    const [customOptions, setCustomOptions] = useState(["", ""]);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileRef = useRef();

    const update = (k) => (e) =>
        setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024)
            return toast.error("Image must be under 5MB");
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setPostType("image");
    };

    const getPollOptions = () => {
        if (pollType === "yesno")
            return [
                { text: "Yes ✅", voteCount: 0 },
                { text: "No ❌", voteCount: 0 },
            ];
        if (pollType === "scale")
            return [
                { text: "Strongly Agree", voteCount: 0 },
                { text: "Agree", voteCount: 0 },
                { text: "Neutral", voteCount: 0 },
                { text: "Disagree", voteCount: 0 },
                { text: "Strongly Disagree", voteCount: 0 },
            ];
        return customOptions
            .filter((o) => o.trim())
            .map((text) => ({ text, voteCount: 0 }));
    };

    const handleSubmit = async () => {
        if (!form.title.trim()) return toast.error("Add a title");
        if (!user) return toast.error("Sign in first");
        if (
            postType === "poll" &&
            pollType === "custom" &&
            customOptions.filter((o) => o.trim()).length < 2
        ) {
            return toast.error("Add at least 2 poll options");
        }
        setLoading(true);
        try {
            let imageURL = null;
            if (imageFile) {
                const storageRef = ref(
                    storage,
                    `posts/${user.uid}/${Date.now()}`,
                );
                await uploadBytes(storageRef, imageFile);
                imageURL = await getDownloadURL(storageRef);
            }

            const pollOptions = postType === "poll" ? getPollOptions() : null;
            let pollId = null;

            const postData = {
                title: form.title.trim(),
                description: form.description.trim(),
                category: postType === "poll" ? "poll" : form.category,
                imageURL,
                hasPoll: postType === "poll",
                pollPreview: form.title,
                authorName: profile?.displayName || user.displayName,
                authorPhotoURL: profile?.photoURL || user.photoURL,
                authorVerified: profile?.verified || false,
                authorPlatoon: profile?.platoonNumber || null,
                authorCamp: profile?.campLocation || null,
            };

            const postId = await createPost(user.uid, postData);

            if (postType === "poll") {
                pollId = await createPoll(postId, user.uid, {
                    question: form.title,
                    type: pollType,
                    options: pollOptions,
                });
                const { updateDoc, doc } = await import("firebase/firestore");
                const { db } = await import("@/lib/firebase");
                await updateDoc(doc(db, "posts", postId), {
                    pollId,
                    pollTotalVotes: 0,
                });
            }

            toast.success("Post published! 🎉");
            router.push("/");
        } catch (err) {
            console.error(err);
            toast.error("Failed to publish post");
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        borderColor: "#D6D3C9",
        background: "#FFFDF8",
        color: "#1F2937",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
    };

    return (
        <div className="min-h-screen" style={{ background: "#F8F5EE" }}>
            {/* Header */}
            <header
                className="sticky top-0 z-40 border-b flex items-center h-14 px-4 gap-3 max-w-2xl mx-auto"
                style={{
                    background: "rgba(255,253,248,0.92)",
                    backdropFilter: "blur(12px)",
                    borderColor: "#D6D3C9",
                }}
            >
                <Link href="/" className="p-2 -ml-2 rounded-xl">
                    <ArrowLeft size={20} style={{ color: "#1F2937" }} />
                </Link>
                <h1
                    className="font-display font-bold text-lg flex-1"
                    style={{ color: "#1F2937" }}
                >
                    Create Post
                </h1>
                <button
                    onClick={handleSubmit}
                    disabled={loading || !form.title.trim()}
                    className="px-5 py-2 rounded-2xl font-bold text-sm text-white flex items-center gap-2 transition-all"
                    style={{
                        background: form.title.trim() ? "#556B2F" : "#D6D3C9",
                        opacity: loading ? 0.7 : 1,
                    }}
                >
                    {loading ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        "Publish"
                    )}
                </button>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-4 pb-32 flex flex-col gap-4">
                {/* Post type selector */}
                <div className="flex gap-2">
                    {[
                        { key: "text", icon: "✍️", label: "Text" },
                        { key: "image", icon: "🖼️", label: "Image" },
                        { key: "poll", icon: "📊", label: "Poll" },
                    ].map(({ key, icon, label }) => (
                        <button
                            key={key}
                            onClick={() => setPostType(key)}
                            className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border font-semibold text-xs transition-all"
                            style={{
                                background:
                                    postType === key ? "#EDF2E8" : "#FFFDF8",
                                borderColor:
                                    postType === key ? "#556B2F" : "#D6D3C9",
                                color: postType === key ? "#556B2F" : "#6B7280",
                            }}
                        >
                            <span className="text-lg">{icon}</span>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Category */}
                {postType !== "poll" && (
                    <div>
                        <label
                            className="text-xs font-semibold mb-2 block"
                            style={{ color: "#6B7280" }}
                        >
                            Category
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map((c) => (
                                <button
                                    key={c}
                                    onClick={() =>
                                        setForm((f) => ({ ...f, category: c }))
                                    }
                                    className="px-4 py-1.5 rounded-2xl text-xs font-bold capitalize transition-all"
                                    style={{
                                        background:
                                            form.category === c
                                                ? "#556B2F"
                                                : "#F3F0E8",
                                        color:
                                            form.category === c
                                                ? "white"
                                                : "#6B7280",
                                    }}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Title */}
                <div>
                    <label
                        className="text-xs font-semibold mb-1.5 block"
                        style={{ color: "#6B7280" }}
                    >
                        {postType === "poll" ? "Poll Question *" : "Title *"}
                    </label>
                    <input
                        value={form.title}
                        onChange={update("title")}
                        placeholder={
                            postType === "poll"
                                ? "Is the camp food actually edible? 😅"
                                : "What's the gist?"
                        }
                        className="w-full px-4 py-3 rounded-2xl border text-sm outline-none transition-all font-semibold"
                        style={inputStyle}
                        maxLength={200}
                        onFocus={(e) =>
                            (e.target.style.borderColor = "#556B2F")
                        }
                        onBlur={(e) => (e.target.style.borderColor = "#D6D3C9")}
                    />
                    <div
                        className="text-right text-xs mt-1"
                        style={{ color: "#6B7280" }}
                    >
                        {form.title.length}/200
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label
                        className="text-xs font-semibold mb-1.5 block"
                        style={{ color: "#6B7280" }}
                    >
                        Description
                    </label>
                    <textarea
                        value={form.description}
                        onChange={update("description")}
                        rows={4}
                        maxLength={1000}
                        placeholder="Spill the gist... 👀"
                        className="w-full px-4 py-3 rounded-2xl border text-sm outline-none transition-all resize-none"
                        style={inputStyle}
                        onFocus={(e) =>
                            (e.target.style.borderColor = "#556B2F")
                        }
                        onBlur={(e) => (e.target.style.borderColor = "#D6D3C9")}
                    />
                    <div
                        className="text-right text-xs mt-1"
                        style={{ color: "#6B7280" }}
                    >
                        {form.description.length}/1000
                    </div>
                </div>

                {/* Image upload */}
                {(postType === "image" || imagePreview) && (
                    <div>
                        <label
                            className="text-xs font-semibold mb-1.5 block"
                            style={{ color: "#6B7280" }}
                        >
                            Image
                        </label>
                        {imagePreview ? (
                            <div className="relative rounded-2xl overflow-hidden">
                                <Image
                                    src={imagePreview}
                                    alt="preview"
                                    width={1200}
                                    height={480}
                                    loading="lazy"
                                    className="w-full max-h-64 object-cover"
                                />
                                <button
                                    onClick={() => {
                                        setImageFile(null);
                                        setImagePreview(null);
                                    }}
                                    className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                                    style={{ background: "rgba(0,0,0,0.6)" }}
                                >
                                    <X size={16} color="white" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => fileRef.current?.click()}
                                className="w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all"
                                style={{
                                    borderColor: "#D6D3C9",
                                    background: "#F3F0E8",
                                }}
                            >
                                <Image
                                    size={24}
                                    alt="upload image"
                                    style={{ color: "#6B7280" }}
                                />
                                <span
                                    className="text-sm"
                                    style={{ color: "#6B7280" }}
                                >
                                    Tap to upload image
                                </span>
                            </button>
                        )}
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImage}
                        />
                    </div>
                )}

                {/* Poll options */}
                {postType === "poll" && (
                    <div>
                        <label
                            className="text-xs font-semibold mb-2 block"
                            style={{ color: "#6B7280" }}
                        >
                            Poll Type
                        </label>
                        <div className="flex flex-col gap-2 mb-4">
                            {POLL_TYPES.map(({ key, label, desc }) => (
                                <button
                                    key={key}
                                    onClick={() => setPollType(key)}
                                    className="flex items-center gap-3 p-3 rounded-2xl border text-left transition-all"
                                    style={{
                                        background:
                                            pollType === key
                                                ? "#EDF2E8"
                                                : "#FFFDF8",
                                        borderColor:
                                            pollType === key
                                                ? "#556B2F"
                                                : "#D6D3C9",
                                    }}
                                >
                                    <div
                                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                                        style={{
                                            borderColor:
                                                pollType === key
                                                    ? "#556B2F"
                                                    : "#D6D3C9",
                                        }}
                                    >
                                        {pollType === key && (
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{
                                                    background: "#556B2F",
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <div
                                            className="text-sm font-bold"
                                            style={{ color: "#1F2937" }}
                                        >
                                            {label}
                                        </div>
                                        <div
                                            className="text-xs"
                                            style={{ color: "#6B7280" }}
                                        >
                                            {desc}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {pollType === "yesno" && (
                            <div className="flex gap-2">
                                {["Yes ✅", "No ❌"].map((o) => (
                                    <div
                                        key={o}
                                        className="flex-1 py-3 rounded-2xl border text-center text-sm font-semibold"
                                        style={{
                                            background: "#F3F0E8",
                                            borderColor: "#D6D3C9",
                                            color: "#6B7280",
                                        }}
                                    >
                                        {o}
                                    </div>
                                ))}
                            </div>
                        )}

                        {pollType === "scale" && (
                            <div className="flex flex-col gap-2">
                                {[
                                    "Strongly Agree",
                                    "Agree",
                                    "Neutral",
                                    "Disagree",
                                    "Strongly Disagree",
                                ].map((o) => (
                                    <div
                                        key={o}
                                        className="py-2.5 px-4 rounded-xl border text-sm font-medium"
                                        style={{
                                            background: "#F3F0E8",
                                            borderColor: "#D6D3C9",
                                            color: "#6B7280",
                                        }}
                                    >
                                        {o}
                                    </div>
                                ))}
                            </div>
                        )}

                        {pollType === "custom" && (
                            <div className="flex flex-col gap-2">
                                {customOptions.map((opt, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2"
                                    >
                                        <input
                                            value={opt}
                                            onChange={(e) => {
                                                const arr = [...customOptions];
                                                arr[i] = e.target.value;
                                                setCustomOptions(arr);
                                            }}
                                            placeholder={`Option ${i + 1}`}
                                            className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none"
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
                                        {customOptions.length > 2 && (
                                            <button
                                                onClick={() =>
                                                    setCustomOptions(
                                                        customOptions.filter(
                                                            (_, j) => j !== i,
                                                        ),
                                                    )
                                                }
                                                className="p-2 rounded-xl"
                                                style={{
                                                    background: "#FEE2E2",
                                                }}
                                            >
                                                <Trash2
                                                    size={14}
                                                    style={{ color: "#EF4444" }}
                                                />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {customOptions.length < 6 && (
                                    <button
                                        onClick={() =>
                                            setCustomOptions([
                                                ...customOptions,
                                                "",
                                            ])
                                        }
                                        className="flex items-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed text-sm font-semibold"
                                        style={{
                                            borderColor: "#556B2F",
                                            color: "#556B2F",
                                            background: "#EDF2E8",
                                        }}
                                    >
                                        <Plus size={16} /> Add Option
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
