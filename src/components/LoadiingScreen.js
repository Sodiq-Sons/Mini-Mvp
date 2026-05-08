export default function LoadingScreen({ message = "Loading..." }) {
    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center"
            style={{ background: "#F8F5EE" }}
        >
            <div className="flex flex-col items-center gap-4">
                <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                    style={{ background: "#556B2F" }}
                >
                    ⛺
                </div>
                <div
                    className="font-display font-bold text-xl"
                    style={{ color: "#556B2F" }}
                >
                    Camp Connect
                </div>
                <div
                    className="w-8 h-8 border-[3px] border-t-transparent rounded-full animate-spin"
                    style={{
                        borderColor: "#556B2F",
                        borderTopColor: "transparent",
                    }}
                />
                <p className="text-sm" style={{ color: "#6B7280" }}>
                    {message}
                </p>
            </div>
        </div>
    );
}
