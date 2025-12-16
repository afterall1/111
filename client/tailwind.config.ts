import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}", // Kapsam genişletildi
    ],
    theme: {
        extend: {
            colors: {
                'void': '#000000', // Tam siyah
                'holo-teal': '#00F0FF',
                'holo-pink': '#FF0055',
                'glass': 'rgba(255, 255, 255, 0.03)',
            },
            fontFamily: {
                mono: ['var(--font-jetbrains-mono)', 'monospace'],
                sans: ['var(--font-inter)', 'sans-serif'],
            },
            backgroundImage: {
                'holo-gradient': 'linear-gradient(180deg, rgba(0, 240, 255, 0) 0%, rgba(0, 240, 255, 0.1) 100%)',
            },
        },
    },
    plugins: [],
};
export default config;
