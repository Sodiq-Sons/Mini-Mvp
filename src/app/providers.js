"use client";

import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }) {
    useEffect(() => {
        // Register service worker
        if (
            "serviceWorker" in navigator &&
            process.env.NODE_ENV === "production"
        ) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((reg) => console.log("✓ Service Worker registered"))
                .catch((err) => console.log("✗ SW registration failed:", err));
        }
    }, []);

    return (
        <>
            {children}
            <Toaster
                position="top-center"
                toastOptions={{
                    style: {
                        background: "#FFFDF8",
                        color: "#1F2937",
                        border: "1px solid #D6D3C9",
                        borderRadius: "12px",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: "14px",
                    },

                    success: {
                        iconTheme: {
                            primary: "#556B2F",
                            secondary: "#fff",
                        },
                    },
                }}
            />
        </>
    );
}
