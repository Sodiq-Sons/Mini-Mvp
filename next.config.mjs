import withPWA from "next-pwa";

const nextConfig = {
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "firebasestorage.googleapis.com" },
            { protocol: "https", hostname: "lh3.googleusercontent.com" },
            { protocol: "https", hostname: "lh4.googleusercontent.com" },
            { protocol: "https", hostname: "lh5.googleusercontent.com" },
            { protocol: "https", hostname: "lh6.googleusercontent.com" },
            { protocol: "https", hostname: "avatars.githubusercontent.com" },
        ],
    },
    compress: true,
    poweredByHeader: false,
    experimental: {
        turbopack: false,
    },
};

export default withPWA({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === "development",
})(nextConfig);
