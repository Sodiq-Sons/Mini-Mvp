module.exports = {
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx}",
        "./src/components/**/*.{js,ts,jsx,tsx}",
        "./src/pages/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#556B2F",
                secondary: "#3E5F44",
                accent: "#F59E0B",
                background: "#F8F5EE",
                card: "#FFFDF8",
                textDark: "#1F2937",
                textLight: "#6B7280",
            },
        },
    },
    plugins: [],
};
