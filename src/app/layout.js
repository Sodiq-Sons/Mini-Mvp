import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import Providers from "./providers";
import "./globals.css";

export const viewport = {
    themeColor: "#556B2F",
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
};

export const metadata = {
    metadataBase: new URL("https://campconnect.vercel.app"),

    title: {
        default: "Camp Connect — NYSC Social Hub",
        template: "%s | Camp Connect",
    },

    description:
        "Camp Connect is the ultimate social platform for Nigerian NYSC corps members to share camp experiences, vote in polls, discuss food, connect with platoons, and engage with fellow corpers.",

    keywords: [
        "NYSC",
        "Camp Connect",
        "Corpers",
        "NYSC Nigeria",
        "NYSC social media",
        "NYSC app",
        "Camp gist",
        "Nigerian youth",
        "Corpers platform",
        "NYSC community",
        "NYSC discussions",
        "Camp social network",
        "Corpers forum",
    ],

    authors: [
        {
            name: "Camp Connect Team",
        },
    ],

    creator: "Camp Connect",
    publisher: "Camp Connect",
    applicationName: "Camp Connect",
    category: "social networking",
    manifest: "/manifest.json",

    alternates: {
        canonical: "https://campconnect.vercel.app",
    },

    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Camp Connect",
    },

    icons: {
        icon: [
            {
                url: "/favicon.ico",
            },
            {
                url: "/icon-192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                url: "/icon-512.png",
                sizes: "512x512",
                type: "image/png",
            },
        ],

        apple: [
            {
                url: "/apple-icon.png",
                sizes: "180x180",
                type: "image/png",
            },
        ],
    },

    openGraph: {
        title: "Camp Connect — NYSC Social Hub",
        description:
            "A modern social platform for Nigerian NYSC corps members to connect, share camp experiences, vote in polls, and discuss trending camp topics.",
        url: "https://campconnect.vercel.app",
        siteName: "Camp Connect",
        locale: "en_NG",
        type: "website",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "Camp Connect",
            },
        ],
    },

    twitter: {
        card: "summary_large_image",
        title: "Camp Connect — NYSC Social Hub",
        description: "The ultimate social platform for Nigerian corps members.",
        images: ["/og-image.png"],
    },

    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#556B2F" />

                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin=""
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>

            <body>
                <AuthProvider>
                    <Providers>{children}</Providers>
                </AuthProvider>
            </body>
        </html>
    );
}
