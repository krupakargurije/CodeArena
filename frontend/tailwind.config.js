/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable class-based dark mode
    theme: {
        extend: {
            colors: {
                // LeetCode Brand Color - Preserved but slightly vibrated
                'brand-orange': '#ffa116',
                'brand-blue': '#007AFF', // Added vibrant blue from new design

                // Difficulty Colors
                'difficulty-easy': '#00b8a3',
                'difficulty-medium': '#ffc01e',
                'difficulty-hard': '#ff375f',

                // Dark Theme Colors - Premium Palette
                'dark-bg-primary': '#121212',   // Deep charcoal/black
                'dark-bg-secondary': '#1e1e1e', // Slightly lighter for cards
                'dark-bg-tertiary': '#2d2d2d',  // Inputs/Hover
                'dark-bg-elevated': '#333333',

                'dark-text-primary': '#ffffff',
                'dark-text-secondary': '#a0a0a0',
                'dark-text-tertiary': '#666666',

                'dark-border-primary': '#333333', // Subtle borders
                'dark-border-secondary': '#404040',
                'dark-border-tertiary': '#505050',

                // Light Theme Colors (Keeping for safety/fallback)
                'light-bg-primary': '#ffffff',
                'light-bg-secondary': '#f7f8fa',
                'light-bg-tertiary': '#eff1f6',
                'light-bg-elevated': '#fafafa',

                'light-text-primary': '#262626',
                'light-text-secondary': '#4a4a4a',
                'light-text-tertiary': '#8c8c8c',

                'light-border-primary': '#e5e5e5',
                'light-border-secondary': '#d4d4d4',
                'light-border-tertiary': '#c4c4c4',
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
}
