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
};

export default nextConfig;
