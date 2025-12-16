import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}", // KRİTİK SATIR: Tüm src altını kapsar
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                'neon-teal': '#00F0FF',
                'neon-rose': '#FF0055',
                'card-bg': '#121212', // Kart arka planı
                'glass-border': 'rgba(255, 255, 255, 0.08)',
            },
            fontFamily: {
                sans: ['var(--font-inter)'],
                mono: ['var(--font-jetbrains-mono)'],
            },
        },
    },
    plugins: [],
};
export default config;
